import { RepoTreeNode, ScanResult } from "@app/types/Github";
import { ext } from "@app/utils/github.filters";

export function isRateLimitError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.toLowerCase().includes("rate limit");
}

export function buildManifest(
  files: ScanResult["files"],
  candidates: RepoTreeNode[]
) {
  const byExtension: Record<string, number> = {};
  let bytesTotal = 0;

  for (const f of files) {
    bytesTotal += f.size;
    const e = ext(f.path) || "(no-ext)";
    byExtension[e] = (byExtension[e] ?? 0) + 1;
  }

  const largestFiles = [...candidates]
    .filter((n) => n.type === "blob" && typeof n.size === "number")
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, 15)
    .map((n) => ({ path: n.path, size: n.size ?? 0 }));

  return {
    filesTotal: files.length,
    bytesTotal,
    byExtension,
    largestFiles,
  };
}

export function buildLocalOverview(tree: RepoTreeNode[]) {
  const blobs = tree.filter((t) => t.type === "blob").map((t) => t.path);

  const hasGo =
    blobs.some((p) => p.endsWith(".go")) || blobs.includes("go.mod");
  const hasNode = blobs.includes("package.json");
  const hasBun = blobs.some(
    (p) => p.endsWith("bun.lockb") || p.endsWith("bun.lock")
  );
  const hasVite = blobs.some((p) => p.includes("vite.config."));
  const hasNext = blobs.some(
    (p) =>
      p.includes("next.config.") ||
      p.startsWith("app/") ||
      p.startsWith("pages/")
  );

  const probableStack = [
    hasGo ? "Go" : null,
    hasNode ? "Node.js/TypeScript" : null,
    hasBun ? "Bun" : null,
    hasVite ? "Vite" : null,
    hasNext ? "Next.js" : null,
  ].filter(Boolean) as string[];

  const folderCount: Record<string, number> = {};
  for (const p of blobs) {
    const folder = p.includes("/") ? `${p.split("/")[0]}/` : "(root)";
    folderCount[folder] = (folderCount[folder] ?? 0) + 1;
  }

  const folders = Object.entries(folderCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([path, files]) => ({ path, files }));

  const entryHints = blobs.filter(
    (p) =>
      p === "README.md" ||
      p.endsWith("/main.go") ||
      p === "main.go" ||
      p === "index.ts" ||
      p.endsWith("/index.ts") ||
      p === "src/index.ts" ||
      p === "ui/src/main.tsx" ||
      p === "app/main.go"
  );

  const quickSummary =
    `Repo looks like ${
      probableStack.length ? probableStack.join(", ") : "mixed code"
    } ` +
    `with main areas: ${
      folders
        .map((f) => f.path)
        .slice(0, 5)
        .join(", ") || "unknown"
    }.`;

  return { probableStack, folders, entryHints, quickSummary };
}
