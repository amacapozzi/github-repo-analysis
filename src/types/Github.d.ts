export type Sha = string;

export type RepoRef = {
  owner: string;
  repo: string;
  ref?: string;
};

export type ScanOptions = {
  scanAll?: boolean;

  includeFolders?: string[];
  excludeFolders?: string[];
  allowedExtensions?: string[];

  maxFiles?: number;
  maxBytesPerFile?: number;

  includeDotFiles?: boolean;

  hardStopOnRateLimit?: boolean;
};

export type RepoTreeNode = {
  path: string;
  type: "blob" | "tree";
  sha: Sha;
  size?: number;
  url: string;
};

export type RepoFile = {
  path: string;
  sha: Sha;
  size: number;
  url: string;
  content: string;
  encoding: "utf-8";
};

export type SkipReason =
  | "excluded_folder"
  | "extension_not_allowed"
  | "dotfile_filtered"
  | "likely_binary"
  | "too_large"
  | "fetch_failed"
  | "rate_limited";

export type ScanResult = {
  refResolved: string;
  totalCandidates: number;

  files: RepoFile[];

  skipped: {
    path: string;
    reason: SkipReason;
    details?: string;
  }[];

  manifest: {
    filesTotal: number;
    bytesTotal: number;
    byExtension: Record<string, number>;
    largestFiles: { path: string; size: number }[];
  };

  localOverview: {
    probableStack: string[];
    folders: { path: string; files: number }[];
    entryHints: string[];
    quickSummary: string;
  };
};
