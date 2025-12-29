import { appConfig } from "@app/config/app.config";

export class GithubClient {
  private static readonly API = "https://api.github.com";
  private static readonly API_VERSION = "2022-11-28";

  static headers() {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": this.API_VERSION,
    };

    const token = appConfig.GITHUB_SECRET?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
  }

  static async getJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: this.headers() });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `GitHub request failed (${res.status}) ${url}\n${body.slice(0, 800)}`
      );
    }

    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");
    if (remaining === "0") {
      throw new Error(
        `GitHub rate limit exceeded. Reset: ${reset ?? "unknown"}`
      );
    }

    return (await res.json()) as T;
  }

  static apiUrl(path: string) {
    return `${this.API}${path}`;
  }
}
