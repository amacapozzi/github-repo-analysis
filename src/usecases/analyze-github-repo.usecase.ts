import { AiAnalysisService } from "@app/services/ai.service";
import type { ScanOptions } from "@app/types/Github";
import { GithubService } from "@app/services/github.service";

export class AnalyzeGithubRepoUseCase {
  static async execute(input: {
    owner: string;
    repo: string;
    ref?: string;
    scanOptions?: ScanOptions;
    folderFocus?: string[];
  }) {
    const scan = await GithubService.scanRepoForAI(
      { owner: input.owner, repo: input.repo, ref: input.ref },
      input.scanOptions
    );

    const analysis = await AiAnalysisService.analyzeRepo(scan, {
      owner: input.owner,
      name: input.repo,
    });

    return { scan, analysis };
  }
}
