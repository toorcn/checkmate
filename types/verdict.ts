// Centralized verdict type and helpers for fact-check results

export type Verdict =
  | "verified"
  | "misleading"
  | "false"
  | "satire"
  | "partially_true"
  | "outdated"
  | "exaggerated"
  | "opinion"
  | "rumor"
  | "conspiracy"
  | "debunked";

const VERDICT_SET = new Set< Verdict >([
  "verified",
  "misleading",
  "false",
  "satire",
  "partially_true",
  "outdated",
  "exaggerated",
  "opinion",
  "rumor",
  "conspiracy",
  "debunked",
]);

export function isAffirmative(verdict: Verdict): boolean {
  // Consider these as sufficiently affirmed for credibility boosts
  return verdict === "verified" || verdict === "partially_true";
}

export function normalizeVerdict(
  input: string | undefined | null,
  opts?: { confidence?: number; reasoning?: string }
): Verdict {
  const raw = String(input || "").trim().toLowerCase();

  // Direct match
  if (VERDICT_SET.has(raw as Verdict)) return raw as Verdict;

  // Common aliases mapping
  switch (raw) {
    case "true":
    case "accurate":
    case "mostly_true":
      return "verified";
    case "partly_true":
    case "half_true":
      return "partially_true";
    case "fake":
    case "incorrect":
    case "not_true":
      return "false";
    case "unverified":
    case "unverifiable":
    case "unknown":
    case "no_verdict":
      // Fall through to heuristic selection below
      break;
  }

  // Heuristic selection based on confidence and reasoning keywords
  const confidence = typeof opts?.confidence === "number" ? opts!.confidence : undefined;
  const text = String(opts?.reasoning || "").toLowerCase();

  // If high confidence with positive language, lean verified/partially_true
  if (confidence !== undefined && confidence >= 70) {
    if (/(verified|credible|supported|evidence|confirmed)/.test(text)) {
      return "verified";
    }
    if (/(mixed|partially|somewhat|partly)/.test(text)) {
      return "partially_true";
    }
  }

  // Negative cues
  if (/(false|debunked|hoax|baseless|fabricated)/.test(text)) return "false";
  if (/(misleading|missing context|cherry-picked)/.test(text)) return "misleading";
  if (/(conspiracy)/.test(text)) return "conspiracy";
  if (/(rumor|hearsay)/.test(text)) return "rumor";
  if (/(exaggerated|overstated|overblown)/.test(text)) return "exaggerated";
  if (/(outdated|old|no longer accurate)/.test(text)) return "outdated";
  if (/(satire|parody|humor)/.test(text)) return "satire";

  // If the text suggests opinion/analysis, default to opinion
  if (/(opinion|commentary|analysis|personal view|subjective)/.test(text)) return "opinion";

  // Fallback: choose a safe, non-affirmative but definitive category
  return "opinion";
}


