import { appConfig } from "../config/app.config";

interface GetFromBetween {
  results: string[];
  string: string;
  getFromBetween: (t: string, s: string) => string | boolean;
  removeFromBetween: (t: string, s: string) => void;
  getAllResults: (t: string, s: string) => void;
  get: (t: string, s: string, i: string) => string[];
}

export class GithubService {
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
