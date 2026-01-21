export interface ChangelogCommit {
  hash: string;
  message: string;
  type: "feat" | "fix" | "docs" | "chore" | "refactor" | "other";
}

export interface ChangelogRelease {
  version: string;
  date: string;
  title?: string;
  description?: string;
  commits: ChangelogCommit[];
  hasManualContent: boolean;
}

export function parseCommitType(message: string): ChangelogCommit["type"] {
  if (message.startsWith("feat:") || message.startsWith("feat(")) return "feat";
  if (message.startsWith("fix:") || message.startsWith("fix(")) return "fix";
  if (message.startsWith("docs:") || message.startsWith("docs(")) return "docs";
  if (message.startsWith("chore:") || message.startsWith("chore("))
    return "chore";
  if (message.startsWith("refactor:") || message.startsWith("refactor("))
    return "refactor";
  return "other";
}

export function formatCommitMessage(message: string): string {
  // Remove conventional commit prefix
  return message
    .replace(/^(feat|fix|docs|chore|refactor)(\([^)]+\))?:\s*/, "")
    .trim();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function groupCommitsByType(
  commits: ChangelogCommit[],
): Record<string, ChangelogCommit[]> {
  const groups: Record<string, ChangelogCommit[]> = {
    feat: [],
    fix: [],
    docs: [],
    refactor: [],
    other: [],
  };

  for (const commit of commits) {
    if (commit.type === "chore") continue; // Skip chore commits
    groups[commit.type].push(commit);
  }

  return groups;
}
