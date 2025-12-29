export function buildRepoAnalysisPrompt(input: {
  owner: string;
  repo: string;
  ref: string;
  localOverview: { probableStack: string[]; quickSummary: string; entryHints: string[] };
  manifest: { filesTotal: number; bytesTotal: number; byExtension: Record<string, number> };
}) {
  return `
You are a senior software architect.

Goal:
1) Explain what this repository does (human-friendly summary).
2) Provide a structured JSON report for an AI agent to navigate the codebase.

Repo:
- ${input.owner}/${input.repo} @ ${input.ref}

Local signals:
- probable stack: ${input.localOverview.probableStack.join(", ") || "unknown"}
- entry hints: ${input.localOverview.entryHints.join(", ") || "none"}
- quick: ${input.localOverview.quickSummary}

Manifest:
- files analyzed: ${input.manifest.filesTotal}
- total bytes: ${input.manifest.bytesTotal}
- by extension: ${JSON.stringify(input.manifest.byExtension)}

Rules:
- Use only the provided files.
- If unsure, say "unknown" and explain why.
- Output JSON only (no markdown).

Schema:
{
  "humanSummary": string,
  "techStack": string[],
  "entrypoints": string[],
  "keyFolders": [{"path": string, "purpose": string}],
  "modules": [{"name": string, "paths": string[], "responsibility": string}],
  "dataFlow": [{"from": string, "to": string, "notes": string}],
  "securityFindings": [{"severity": "low"|"medium"|"high", "title": string, "evidence": string, "fix": string}],
  "refactors": [{"priority": "p0"|"p1"|"p2", "title": string, "why": string, "how": string}],
  "aiNextSteps": [{"task": string, "inputsNeeded": string[], "expectedOutput": string}]
}
`.trim();
}
