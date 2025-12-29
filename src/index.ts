import { AiAnalysisService } from "./services/ai.service";
import { AnalysisService } from "./services/analysis.service";
import { GithubService } from "./services/github.service";
import type { RepoRef } from "./types/Github";

const username = "<username>";
const repo = "<repo>";
const ref = "<ref>"; //example main;

const main = async () => {
  const repoRef: RepoRef = { owner: username, repo, ref };

  const scan = await GithubService.scanRepoForAI(repoRef, {
    scanAll: true,
    includeDotFiles: true,
    maxFiles: 20000,
    maxBytesPerFile: 10_000_000,
    hardStopOnRateLimit: true,
  });

  console.log("\n=== SCAN RESULT ===");
  console.log({
    refResolved: scan.refResolved,
    totalCandidates: scan.totalCandidates,
    fetched: scan.files.length,
    skipped: scan.skipped.length,
    manifest: scan.manifest,
    localOverview: scan.localOverview,
  });

  if (scan.skipped.length) {
    console.log("\n=== SKIPPED (first 30) ===");
    console.dir(scan.skipped.slice(0, 30), { depth: null });
  }

  const analysis = await AiAnalysisService.analyzeRepo(scan, {
    owner: username,
    name: repo,
  });

  console.log("\n=== HUMAN SUMMARY ===\n");
  console.log(analysis);

  console.log("\n=== ANALYSIS JSON ===\n");
  console.dir(analysis.rawJson, { depth: null });
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
