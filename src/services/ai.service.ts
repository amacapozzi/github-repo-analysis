import { client as aiClient } from "@app/utils/openai";
import type { ScanResult, RepoFile } from "@app/types/Github";
import { buildRepoAnalysisPrompt } from "@app/ai/analysis.prompt";

type AnalyzeInput = {
  owner: string;
  name: string;
};

export class AiAnalysisService {
  private static readonly MODEL = "llama-3.3-70b-versatile";

  private static readonly MAX_CHARS_PER_REQUEST = 30_000;

  private static isTooLarge(err: any) {
    const msg = String(err?.message ?? "");
    return (
      err?.status === 413 ||
      msg.toLowerCase().includes("request too large") ||
      msg.toLowerCase().includes("tpm") ||
      err?.code === "rate_limit_exceeded"
    );
  }

  private static safeJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first >= 0 && last > first)
        return JSON.parse(text.slice(first, last + 1));
      throw new Error("Model did not return valid JSON");
    }
  }

  private static packFilesByChars(files: RepoFile[], maxChars: number) {
    const batches: RepoFile[][] = [];
    let cur: RepoFile[] = [];
    let size = 0;

    for (const f of files) {
      const payload = `\n\n=== FILE: ${f.path} ===\n${f.content}`;
      if (payload.length > maxChars) {
        batches.push([f]);
        continue;
      }

      if (size + payload.length > maxChars) {
        if (cur.length) batches.push(cur);
        cur = [f];
        size = payload.length;
      } else {
        cur.push(f);
        size += payload.length;
      }
    }

    if (cur.length) batches.push(cur);
    return batches;
  }

  private static renderBatch(files: RepoFile[], maxChars: number) {
    let out = "";
    for (const f of files) {
      const header = `\n\n=== FILE: ${f.path} ===\n`;
      const budget = Math.max(0, maxChars - out.length - header.length);
      const body = budget <= 0 ? "" : f.content.slice(0, budget);
      out += header + body;
      if (out.length >= maxChars) break;
    }
    return out.slice(0, maxChars);
  }

  private static async callModel(userContent: string) {
    const res = await aiClient.chat.completions.create({
      model: this.MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: userContent },
      ],
    });

    return res.choices[0]?.message?.content ?? "";
  }

  public static async analyzeRepo(scan: ScanResult, repo: AnalyzeInput) {
    const fallbackSummary =
      scan.localOverview?.quickSummary ??
      `Scanned ${scan.files.length} files from ${repo.owner}/${repo.name}.`;

    if (!scan.files.length) {
      return {
        humanSummary: fallbackSummary,
        rawJson: {
          humanSummary: fallbackSummary,
          techStack: scan.localOverview?.probableStack ?? [],
          entrypoints: scan.localOverview?.entryHints ?? [],
          keyFolders: [],
          modules: [],
          dataFlow: [],
          securityFindings: [],
          refactors: [],
          aiNextSteps: [
            {
              task: "No files were fetched; check GitHub token and permissions / rate limits.",
              inputsNeeded: ["GITHUB_TOKEN", "repo visibility"],
              expectedOutput: "Successful scan with file contents",
            },
          ],
        },
      };
    }

    const filePaths = scan.files.map((f) => f.path).slice(0, 2000); // cap
    const overviewPrompt = buildRepoAnalysisPrompt({
      owner: repo.owner,
      repo: repo.name,
      ref: scan.refResolved,
      localOverview: scan.localOverview,
      manifest: scan.manifest,
    });

    const overviewInput =
      `${overviewPrompt}\n\n` +
      `You are in OVERVIEW mode.\n` +
      `You MUST infer what the repo does mainly from: README, package/go mod, entry files, and folder structure.\n` +
      `Here are repository file paths (subset):\n` +
      `${JSON.stringify(filePaths)}\n\n` +
      `Provide JSON in the schema.`;

    let overviewJson: any = null;

    try {
      const text = await this.callModel(
        overviewInput.slice(0, this.MAX_CHARS_PER_REQUEST)
      );
      overviewJson = this.safeJsonParse(text);
    } catch {}

    let maxChars = this.MAX_CHARS_PER_REQUEST;
    let batches = this.packFilesByChars(scan.files, maxChars);

    const partials: any[] = [];

    for (let i = 0; i < batches.length; i++) {
      let batch = batches[i];

      for (let attempt = 0; attempt < 4; attempt++) {
        const content = this.renderBatch(batch, maxChars);

        const batchPrompt =
          `${overviewPrompt}\n\n` +
          `You are in DEEP mode, analyzing a PARTIAL batch of files.\n` +
          `Return JSON in the same schema.\n\n` +
          `FILES:\n${content}`;

        try {
          const text = await this.callModel(batchPrompt);
          partials.push(this.safeJsonParse(text));
          break; // success
        } catch (err: any) {
          if (!this.isTooLarge(err)) throw err;

          maxChars = Math.floor(maxChars * 0.6);
          if (maxChars < 8_000) {
            partials.push({
              humanSummary: fallbackSummary,
              techStack: scan.localOverview?.probableStack ?? [],
              entrypoints: scan.localOverview?.entryHints ?? [],
              keyFolders: [],
              modules: [],
              dataFlow: [],
              securityFindings: [
                {
                  severity: "low",
                  title: "Partial analysis only",
                  evidence:
                    "Model request size limits reached; analysis truncated.",
                  fix: "Reduce files per batch or use embeddings-based indexing.",
                },
              ],
              refactors: [],
              aiNextSteps: [],
            });
            break;
          }

          const repacked = this.packFilesByChars(batch, maxChars);
          if (repacked.length > 1) {
            batches.splice(i, 1, ...repacked);
            batch = batches[i];
          }
        }
      }
    }

    const mergePrompt = `
Merge these analyses (same repo) into ONE JSON object using the SAME schema.
- Deduplicate arrays.
- Prefer concrete evidence.
- Keep the best "humanSummary".
- Output JSON only.

OVERVIEW:
${JSON.stringify(overviewJson)}

PARTIALS:
${JSON.stringify(partials)}
`.trim();

    let mergedJson: any;

    try {
      const mergedText = await this.callModel(
        mergePrompt.slice(0, this.MAX_CHARS_PER_REQUEST)
      );
      mergedJson = this.safeJsonParse(mergedText);
    } catch {
      mergedJson = overviewJson ??
        partials[0] ?? { humanSummary: fallbackSummary };
      mergedJson.humanSummary = String(
        mergedJson.humanSummary ?? fallbackSummary
      );
    }

    return {
      humanSummary: String(mergedJson.humanSummary ?? fallbackSummary),
      rawJson: mergedJson,
    };
  }
}
