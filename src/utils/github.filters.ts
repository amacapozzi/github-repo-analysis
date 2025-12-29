export const BinaryExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "zip",
  "rar",
  "7z",
  "gz",
  "tar",
  "pdf",
  "exe",
  "dll",
  "so",
  "dylib",
  "mp3",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "bin",
  "dat",
]);

export function normalizeFolders(folders?: string[]) {
  if (!folders?.length) return undefined;
  return folders.map((f) => (f.endsWith("/") ? f : `${f}/`));
}

export function startsWithAny(path: string, prefixes?: string[]) {
  if (!prefixes?.length) return false;
  return prefixes.some((p) => path.startsWith(p));
}

export function isDotFile(path: string) {
  const base = path.split("/").pop() ?? path;
  return base.startsWith(".");
}

export function ext(path: string): string {
  const name = path.split("/").pop() ?? path;
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

export function looksBinaryByZeroBytes(buf: Buffer) {
  const sample = buf.subarray(0, Math.min(buf.length, 4000));
  let zeros = 0;
  for (const b of sample) if (b === 0) zeros++;
  return zeros > 0;
}
