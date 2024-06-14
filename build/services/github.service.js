"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const app_config_1 = require("../config/app.config");
class GithubService {
    static getRepoLatestReleaseAttachments(username, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`https://github.com/${username}/${repo}/releases/latest`, {
                    redirect: "follow",
                });
                if (!response.ok || response.url.endsWith("/releases")) {
                    //console.error(await response.text());
                    console.error("Failed to fetch latest release res:" +
                        response.status +
                        " | " +
                        response.url);
                    return [];
                }
                return yield this.getRepoReleaseAttachments(username, repo, response.url.split("/").pop());
            }
            catch (error) {
                console.error("Error:", error);
                return [];
            }
        });
    }
    static listReleases(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
            const headers = {
                Authorization: `token ${app_config_1.appConfig.GITHUB_SECRET}`,
                "X-GitHub-Api-Version": "2022-11-28",
            };
            try {
                const response = yield fetch(url, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const releases = yield response.json();
                console.log(releases);
                return releases;
            }
            catch (error) {
                console.error("An error occurred:", error);
            }
        });
    }
    static getRepoReleaseAttachments(username, repo, version) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resources = yield (yield fetch(`https://github.com/${username}/${repo}/releases/expanded_assets/${version}`)).text();
                return getFromBetween
                    .get(resources, 'href="', '"')
                    .map((l) => "https://github.com" + l);
            }
            catch (error) {
                console.error("Error:", error);
                return [];
            }
        });
    }
    static getUserRepos(username_1) {
        return __awaiter(this, arguments, void 0, function* (username, sleepTime = 1000) {
            let repos = [];
            for (let i = 1; i < 10; i++) {
                try {
                    console.log("Fetching page " + i);
                    const response = yield fetch(`https://api.github.com/users/${username}/repos?type=owner&sort=updated&per_page=100&page=${i}`);
                    if (response.status === 200) {
                        let dataChunk = (yield response.json());
                        if (dataChunk.length <= 0)
                            break;
                        repos = repos.concat(dataChunk);
                        if (repos.length < 100)
                            break;
                        yield new Promise((r) => setTimeout(r, sleepTime));
                    }
                    else {
                        throw new Error(`Request failed with status ${response.status}`);
                    }
                }
                catch (error) {
                    console.error(`Error: ${error}`);
                }
            }
            return repos;
        });
    }
}
exports.GithubService = GithubService;
const getFromBetween = {
    results: [],
    string: "",
    getFromBetween: function (t, s) {
        if (this.string.indexOf(t) < 0 || this.string.indexOf(s) < 0)
            return false;
        const i = this.string.indexOf(t) + t.length;
        const e = this.string.substr(0, i);
        const n = this.string.substr(i);
        const r = e.length + n.indexOf(s);
        return this.string.substring(i, r);
    },
    removeFromBetween: function (t, s) {
        if (this.string.indexOf(t) < 0 || this.string.indexOf(s) < 0)
            return;
        const i = t + this.getFromBetween(t, s) + s;
        this.string = this.string.replace(i, "");
    },
    getAllResults: function (t, s) {
        if (!(this.string.indexOf(t) < 0 || this.string.indexOf(s) < 0)) {
            const i = this.getFromBetween(t, s);
            this.results.push(i);
            this.removeFromBetween(t, s);
            if (this.string.indexOf(t) > -1 && this.string.indexOf(s) > -1) {
                this.getAllResults(t, s);
            }
        }
    },
    get: function (t, s, i) {
        this.results = [];
        this.string = t;
        this.getAllResults(s, i);
        return this.results;
    },
};
