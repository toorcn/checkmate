export type Verdict = "verified" | "misleading" | "false" | "unverified" | "satire";

export interface OriginTracingData {
  hypothesizedOrigin?: string;
  firstSeenDates?: Array<{ source: string; date?: string; url?: string }>;
  propagationPaths?: string[];
  evolutionSteps?: Array<{ platform: string; transformation: string; impact?: string; date?: string }>;
}

export interface BeliefDriver {
  name: string;
  description: string;
  references?: Array<{ title: string; url: string }>;
}

export interface FactCheckSource {
  url: string;
  title: string;
  source?: string;
  credibility: number;
}

export interface OriginTracingResult {
  originTracing: OriginTracingData;
  beliefDrivers: BeliefDriver[];
  sources: FactCheckSource[];
  verdict?: Verdict;
}

function getHostnameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function computeCredibilityFromUrl(url: string): number {
  const host = getHostnameFromUrl(url) || "";
  const h = host.toLowerCase();
  const high: string[] = [
    "reuters.com",
    "apnews.com",
    "associatedpress.com",
    "bbc.com",
    "bbc.co.uk",
    "npr.org",
    "factcheck.org",
    "snopes.com",
    "politifact.com",
    "washingtonpost.com",
    "nytimes.com",
    "nature.com",
    "sciencemag.org",
  ];
  if (
    h.endsWith(".gov") ||
    h.endsWith(".gov.uk") ||
    h.endsWith(".edu") ||
    h.includes("who.int") ||
    h.includes("nih.gov") ||
    h.includes("cdc.gov")
  ) {
    return 95;
  }
  if (high.some((d) => h.endsWith(d))) return 92;
  if (h.includes("medium.com") || h.includes("substack.com")) return 65;
  if (
    h.includes("twitter.com") ||
    h.includes("x.com") ||
    h.includes("facebook.com") ||
    h.includes("tiktok.com") ||
    h.includes("youtube.com")
  )
    return 55;
  return 60;
}

function extractMarkdownLinks(text: string): Array<{ title: string; url: string }> {
  const links: Array<{ title: string; url: string }> = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    links.push({ title: match[1], url: match[2] });
  }
  // Deduplicate by url
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
}

function findSection(text: string, titles: string[]): { start: number; end: number } | null {
  const lines = text.split("\n");
  const headerRegex = /^(#{1,6})\s+(.+)$|^\*\*([^*]+):\*\*$/; // markdown or legacy **Header:**
  const normalizedTitles = titles.map((t) => t.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(headerRegex);
    if (m) {
      const headerText = (m[2] || m[3] || "").toLowerCase();
      if (normalizedTitles.some((t) => headerText.includes(t))) {
        // find end until next header
        let j = i + 1;
        for (; j < lines.length; j++) {
          const l2 = lines[j].trim();
          if (headerRegex.test(l2)) break;
        }
        return { start: i + 1, end: j };
      }
    }
  }
  return null;
}

function parseVerdict(text: string): Verdict | undefined {
  const m = text.match(/verdict\s*[:\-]\s*([a-zA-Z\s]+)/i);
  if (!m) return undefined;
  const v = m[1].trim().toLowerCase();
  if (/(true|accurate|verified)/.test(v)) return "verified";
  if (/(partly|partial|partially|mixed|misleading)/.test(v)) return "misleading";
  if (/(false|fake|fabricated)/.test(v)) return "false";
  if (/(satire)/.test(v)) return "satire";
  if (/(unverified|unknown|unclear)/.test(v)) return "unverified";
  return undefined;
}

export function parseOriginTracing(content: string): OriginTracingResult {
  const originSection = findSection(content, [
    "origin tracing",
    "origin",
    "original source",
    "hypothesized origin",
  ]);
  const timelineSection = findSection(content, [
    "first seen",
    "timeline",
    "first appearance",
  ]);
  const propagationSection = findSection(content, [
    "propagation",
    "spread",
    "amplification",
    "platforms",
  ]);
  const sourcesSection = findSection(content, [
    "sources",
    "references",
    "citations",
    "fact check sources",
  ]);
  const beliefsSection = findSection(content, [
    "belief drivers",
    "why people believe",
    "cognitive biases",
  ]);

  const lines = content.split("\n");

  // Hypothesized origin: first non-empty line from origin section
  let hypothesizedOrigin: string | undefined;
  if (originSection) {
    const slice = lines
      .slice(originSection.start, originSection.end)
      .map((l) => l.trim())
      .filter(Boolean);
    hypothesizedOrigin = slice[0];
  }

  // First seen dates: bullet lines with optional (YYYY-MM-DD)
  const firstSeenDates: Array<{ source: string; date?: string; url?: string }> = [];
  if (timelineSection) {
    const slice = lines.slice(timelineSection.start, timelineSection.end);
    for (const raw of slice) {
      const l = raw.trim();
      if (!/^[-*]\s+/.test(l)) continue;
      const dateMatch = l.match(/\((\d{4}-\d{2}-\d{2})\)/);
      const linkMatch = l.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      let sourceText = l.replace(/^[-*]\s+/, "");
      if (linkMatch) sourceText = linkMatch[1];
      firstSeenDates.push({
        source: sourceText.replace(/\s*\(.*?\)\s*$/, "").trim(),
        date: dateMatch?.[1],
        url: linkMatch?.[2],
      });
    }
  }

  // Propagation paths: bullet lines under section
  const propagationPaths: string[] = [];
  if (propagationSection) {
    const slice = lines.slice(propagationSection.start, propagationSection.end);
    for (const raw of slice) {
      const l = raw.trim();
      if (/^[-*]\s+/.test(l)) {
        const text = l.replace(/^[-*]\s+/, "").trim();
        if (text) propagationPaths.push(text);
      }
    }
  }

  // Sources: prefer links in Sources section; fallback to all links
  let linkPool: Array<{ title: string; url: string }> = [];
  if (sourcesSection) {
    const slice = lines.slice(sourcesSection.start, sourcesSection.end).join("\n");
    linkPool = extractMarkdownLinks(slice);
  }
  if (linkPool.length === 0) {
    linkPool = extractMarkdownLinks(content);
  }
  const sources = linkPool.map((l) => ({
    url: l.url,
    title: l.title,
    credibility: computeCredibilityFromUrl(l.url),
  }));

  // Belief drivers: lines like - **Name:** description
  const beliefDrivers: Array<{
    name: string;
    description: string;
    references?: Array<{ title: string; url: string }>;
  }> = [];
  if (beliefsSection) {
    const slice = lines.slice(beliefsSection.start, beliefsSection.end);
    for (const raw of slice) {
      const l = raw.trim();
      if (/^[-*]\s+\*\*[^*]+:\*\*/.test(l)) {
        const m = l.match(/^[-*]\s+\*\*([^*]+):\*\*\s*(.*)$/);
        if (m) beliefDrivers.push({ name: m[1].trim(), description: m[2].trim() });
      }
    }
  }

  const verdict = parseVerdict(content);

  return {
    originTracing: {
      hypothesizedOrigin,
      firstSeenDates: firstSeenDates.length ? firstSeenDates : undefined,
      propagationPaths: propagationPaths.length ? propagationPaths : undefined,
    },
    beliefDrivers,
    sources,
    verdict,
  };
}


