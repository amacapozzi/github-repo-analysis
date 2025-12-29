import { appConfig } from "@app/config/app.config";
import {
  BinaryExtensions,
  ext,
  isDotFile,
  looksBinaryByZeroBytes,
  normalizeFolders,
  startsWithAny,
} from "@app/utils/github.filters";
import { GithubClient } from "@app/utils/github.client";
import type {
  RepoRef,
  RepoTreeNode,
  ScanOptions,
  ScanResult,
} from "@app/types/Github";
import {
  buildLocalOverview,
  buildManifest,
  isRateLimitError,
} from "@app/utils/scan.helper";
interface GetFromBetween {
  results: string[];
  string: string;
  getFromBetween: (t: string, s: string) => string | boolean;
  removeFromBetween: (t: string, s: string) => void;
  getAllResults: (t: string, s: string) => void;
  get: (t: string, s: string, i: string) => string[];
}

export class GithubService {
  private static async getDefaultBranch(ref: RepoRef): Promise<string> {
    const data = await GithubClient.getJson<{ default_branch: string }>(
      GithubClient.apiUrl(`/repos/${ref.owner}/${ref.repo}`)
    );
    return data.default_branch;
  }

  private static async getRepoTree(
    ref: RepoRef
  ): Promise<{ refResolved: string; tree: RepoTreeNode[] }> {
    const refResolved = ref.ref ?? (await this.getDefaultBranch(ref));

    const data = await GithubClient.getJson<{ tree: RepoTreeNode[] }>(
      GithubClient.apiUrl(
        `/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(
          refResolved
        )}?recursive=1`
      )
    );

    return { refResolved, tree: data.tree };
  }

  private static async getFileContent(
    ref: RepoRef,
    refResolved: string,
    path: string
  ): Promise<{ content: string; size: number; sha: string; url: string }> {
    const q = `?ref=${encodeURIComponent(refResolved)}`;
    const data = await GithubClient.getJson<{
      type: "file";
      encoding: "base64";
      size: number;
      sha: string;
      url: string;
      content: string;
    }>(
      GithubClient.apiUrl(
        `/repos/${ref.owner}/${ref.repo}/contents/${encodeURIComponent(
          path
        )}${q}`
      )
    );

    const buf = Buffer.from(data.content.replace(/\n/g, ""), "base64");
    if (looksBinaryByZeroBytes(buf)) throw new Error("Likely binary file");

    return {
      content: buf.toString("utf-8"),
      size: data.size,
      sha: data.sha,
      url: data.url,
    };
  }

  public static async scanRepoForAI(
    ref: RepoRef,
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    const scanAll = options.scanAll ?? false;

    const maxFiles = options.maxFiles ?? (scanAll ? 10_000 : 200);
    const maxBytesPerFile =
      options.maxBytesPerFile ?? (scanAll ? 10_000_000 : 250_000);
    const includeDotFiles = options.includeDotFiles ?? true;
    const hardStopOnRateLimit = options.hardStopOnRateLimit ?? true;

    const includeFolders = scanAll
      ? undefined
      : normalizeFolders(options.includeFolders);
    const excludeFolders = scanAll
      ? undefined
      : normalizeFolders(options.excludeFolders);
    const allowedExtensions = scanAll
      ? undefined
      : options.allowedExtensions?.map((e) => e.toLowerCase());

    const { refResolved, tree } = await this.getRepoTree(ref);

    const candidates = tree.filter((n) => n.type === "blob");
    const skipped: ScanResult["skipped"] = [];
    const files: ScanResult["files"] = [];

    for (const node of candidates) {
      if (files.length >= maxFiles) break;

      const path = node.path;

      if (!includeDotFiles && isDotFile(path)) {
        skipped.push({ path, reason: "dotfile_filtered" });
        continue;
      }

      if (!scanAll) {
        if (includeFolders?.length && !startsWithAny(path, includeFolders)) {
          skipped.push({ path, reason: "excluded_folder" });
          continue;
        }

        if (excludeFolders?.length && startsWithAny(path, excludeFolders)) {
          skipped.push({ path, reason: "excluded_folder" });
          continue;
        }

        const e = ext(path);

        if (e && BinaryExtensions.has(e)) {
          skipped.push({ path, reason: "likely_binary" });
          continue;
        }

        if (allowedExtensions?.length && e && !allowedExtensions.includes(e)) {
          skipped.push({ path, reason: "extension_not_allowed" });
          continue;
        }
      }

      const size = node.size ?? 0;
      if (size > maxBytesPerFile) {
        skipped.push({
          path,
          reason: "too_large",
          details: `candidate size=${size} > max=${maxBytesPerFile}`,
        });
        continue;
      }

      try {
        const file = await this.getFileContent(ref, refResolved, path);

        if (file.size > maxBytesPerFile) {
          skipped.push({
            path,
            reason: "too_large",
            details: `content size=${file.size} > max=${maxBytesPerFile}`,
          });
          continue;
        }

        if (scanAll) {
          const buf = Buffer.from(file.content, "utf-8");
          if (looksBinaryByZeroBytes(buf)) {
          }
        }

        files.push({
          path,
          sha: file.sha,
          size: file.size,
          url: file.url,
          content: file.content,
          encoding: "utf-8",
        });
      } catch (err) {
        if (isRateLimitError(err)) {
          skipped.push({ path, reason: "rate_limited", details: String(err) });
          if (hardStopOnRateLimit) break;
          continue;
        }

        skipped.push({ path, reason: "fetch_failed", details: String(err) });
      }
    }

    const manifest = buildManifest(files, candidates);
    const localOverview = buildLocalOverview(tree);

    return {
      refResolved,
      totalCandidates: candidates.length,
      files,
      skipped,
      manifest,
      localOverview,
    };
  }

  public static async getRepoLatestReleaseAttachments(
    username: string,
    repo: string
  ): Promise<string[]> {
    try {
      const response = await fetch(
        `https://github.com/${username}/${repo}/releases/latest`,
        {
          redirect: "follow",
        }
      );

      if (!response.ok || !response.url.endsWith("/releases")) {
        //console.error(await response.text());
        console.error(
          "Failed to fetch latest release res:" +
            response.status +
            " | " +
            response.url
        );
        return [];
      }

      return await this.getRepoReleaseAttachments(
        username,
        repo,
        response.url.split("/").pop() as string
      );
    } catch (error) {
      console.error("Error:", error);

      return [];
    }
  }

  public static async listReleases(owner: string, repo: string): Promise<any> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
    const headers = {
      Authorization: `token ${appConfig.GITHUB_SECRET}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const releases = await response.json();
      console.log(releases);
      return releases;
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  public static async getRepoReleaseAttachments(
    username: string,
    repo: string,
    version: string
  ): Promise<string[]> {
    try {
      const resources = await (
        await fetch(
          `https://github.com/${username}/${repo}/releases/expanded_assets/${version}`
        )
      ).text();

      return getFromBetween
        .get(resources, 'href="', '"')
        .map((l) => "https://github.com" + l);
    } catch (error) {
      console.error("Error:", error);

      return [];
    }
  }

  public static async getUserRepos(
    username: string,
    sleepTime: number = 1000
  ): Promise<any[]> {
    let repos: any[] = [];

    for (let i = 1; i < 10; i++) {
      try {
        console.log("Fetching page " + i);

        const response = await fetch(
          `https://api.github.com/users/${username}/repos?type=owner&sort=updated&per_page=100&page=${i}`
        );

        if (response.status === 200) {
          let dataChunk = (await response.json()) as any[];

          if (dataChunk.length <= 0) break;

          repos = repos.concat(dataChunk);

          if (repos.length < 100) break;

          await new Promise((r) => setTimeout(r, sleepTime));
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`Error: ${error}`);
      }
    }

    return repos;
  }
}

const getFromBetween: GetFromBetween = {
  results: [],
  string: "",
  getFromBetween: function (t: string, s: string): string | boolean {
    if (this.string.indexOf(t) < 0 || this.string.indexOf(s) < 0) return false;
    const i = this.string.indexOf(t) + t.length;
    const e = this.string.substr(0, i);
    const n = this.string.substr(i);
    const r = e.length + n.indexOf(s);
    return this.string.substring(i, r);
  },
  removeFromBetween: function (t: string, s: string): void {
    if (this.string.indexOf(t) < 0 || this.string.indexOf(s) < 0) return;
    const i = t + this.getFromBetween(t, s) + s;
    this.string = this.string.replace(i, "");
  },
  getAllResults: function (t: string, s: string): void {
    if (!(this.string.indexOf(t) < 0 || this.string.indexOf(s) < 0)) {
      const i = this.getFromBetween(t, s);
      this.results.push(i as string);
      this.removeFromBetween(t, s);
      if (this.string.indexOf(t) > -1 && this.string.indexOf(s) > -1) {
        this.getAllResults(t, s);
      }
    }
  },
  get: function (t: string, s: string, i: string): string[] {
    this.results = [];
    this.string = t;
    this.getAllResults(s, i);
    return this.results;
  },
};
