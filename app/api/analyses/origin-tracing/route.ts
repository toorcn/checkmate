import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { textModel, DEFAULT_ANALYSIS_MAX_TOKENS, DEFAULT_ANALYSIS_TEMPERATURE } from '@/lib/ai';
import { parseOriginTracing, computeCredibilityFromUrl } from '@/lib/analysis/parseOriginTracing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content: string | undefined = body?.content;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }
    // Lightweight parser pass first
    const parsed = parseOriginTracing(content);

    // AI summarization & classification to normalize and enrich fields
    interface AiOutput {
      originTracing?: {
        hypothesizedOrigin?: string | null;
        firstSeenDates?: Array<{ source: string; date?: string; url?: string }> | null;
        propagationPaths?: string[] | null;
        evolutionSteps?: Array<{ platform: string; transformation: string; impact?: string; date?: string }> | null;
      } | null;
      beliefDrivers?: Array<{
        name?: string;
        description?: string;
        references?: Array<{ title?: string; url?: string }>;
      }>;
      sources?: Array<{ title?: string; url?: string }>;
      verdict?: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
      claim?: string;
    }
    const prompt = `You are an origin-tracing and misinformation analysis assistant.

Task: Read the following analysis text and produce a compact JSON with:
- originTracing: { hypothesizedOrigin: string | null, firstSeenDates: Array<{source: string, date?: string, url?: string}> | null, evolutionSteps: Array<{platform: string, transformation: string, impact?: string, date?: string}> | null }
- beliefDrivers: Array<{ name: string, description: string, references?: Array<{ title: string, url: string }> }>
- sources: Array<{ title: string, url: string, source?: string }>
- verdict: one of [verified, misleading, false, unverified, satire]
- claim: the current claim summarized as one sentence

Guidelines (optimize for rich, comprehensive node coverage without fabrication):
- Extract AS MANY distinct items as present in the text; do not invent facts.
- Targets: firstSeenDates up to 15, evolutionSteps up to 10, beliefDrivers up to 10, sources up to 15.
- For evolutionSteps: Show HOW the belief/claim transformed on each platform, not just platform names. Include the specific adaptation, amplification, or mutation that occurred.
- For sources: Include both 'title' and 'source' fields where 'source' is the publication/organization name (e.g., "Reuters", "Snopes") and 'title' is the article title.
- Include dates and URLs whenever available. Prefer diverse platforms (forums, social, influencers, blogs, news, messaging).
- For beliefDrivers references: Link to practical debunking articles, fact-check explanations, or accessible journalism that explains similar cases - NOT academic papers. Focus on articles that help laypeople understand how misinformation spreads in real-world scenarios.
- Deduplicate obvious duplicates while preserving distinct sources.

TEXT START\n${content}\nTEXT END

Return ONLY valid JSON.`;

    let ai: AiOutput | null = null;
    try {
      const { text } = await generateText({
        model: textModel(),
        system: 'Extract structured origin-tracing data for visualization. Be precise and grounded in the text.',
        prompt,
        maxTokens: Math.max(DEFAULT_ANALYSIS_MAX_TOKENS, 4000),
        temperature: DEFAULT_ANALYSIS_TEMPERATURE,
      });
      // Best-effort JSON parse
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsedObj = JSON.parse(text.slice(start, end + 1));
        ai = parsedObj as AiOutput;
      }
    } catch {
      // Fall through to parsed-only response
    }

    // Merge AI output with parsed fallback
    const aiOT: AiOutput = (ai ?? {}) as AiOutput;
    // Merge helpers
    const uniqBy = <T, K extends string | number>(items: T[], keyFn: (t: T) => K) => {
      const map = new Map<K, T>();
      for (const it of items) {
        const k = keyFn(it);
        if (!map.has(k)) map.set(k, it);
      }
      return Array.from(map.values());
    };

    // Merge origin tracing pieces for richer detail
    const firstSeenDatesMerged = uniqBy(
      [
        ...((aiOT.originTracing?.firstSeenDates || []) as Array<{ source: string; date?: string; url?: string }>),
        ...((parsed.originTracing.firstSeenDates || []) as Array<{ source: string; date?: string; url?: string }>),
      ],
      (d) => `${(d.source || '').toLowerCase()}|${d.date || ''}|${d.url || ''}`
    ).slice(0, 15);

        const evolutionStepsMerged = [
          ...((aiOT.originTracing?.evolutionSteps || []) as Array<{platform: string, transformation: string, impact?: string, date?: string}>),
          ...((parsed.originTracing.propagationPaths || []).map((path: string) => ({ platform: path, transformation: `Content spread through ${path}` })) as Array<{platform: string, transformation: string}>),
        ].slice(0, 10);
        
        // Fallback to legacy propagationPaths if no evolutionSteps
        const propagationPathsMerged = Array.from(
          new Set<string>([
            ...((aiOT.originTracing?.propagationPaths || []) as string[]),
            ...((parsed.originTracing.propagationPaths || []) as string[]),
          ].map((s) => String(s)))
        ).slice(0, 15);

    // Merge belief drivers by name (case-insensitive), prefer AI descriptions and references
    const aiDrivers = (Array.isArray(aiOT.beliefDrivers) ? aiOT.beliefDrivers : []) as Array<{ name?: string; description?: string; references?: Array<{ title?: string; url?: string }> }>;
    const parsedDrivers = parsed.beliefDrivers || [];
    const driversMap = new Map<string, { name: string; description: string; references?: Array<{ title: string; url: string }> }>();
    for (const d of parsedDrivers) {
      if (!d?.name) continue;
      driversMap.set(d.name.toLowerCase(), { name: d.name, description: d.description, references: d.references });
    }
    for (const b of aiDrivers) {
      const name = String(b.name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const cleanedRefs = Array.isArray(b.references)
        ? b.references
            .map((r) => ({
              title: typeof r?.title === 'string' && r.title.trim() ? String(r.title) : undefined,
              url: typeof r?.url === 'string' && r.url.trim() ? String(r.url) : undefined,
            }))
            .filter((r) => Boolean(r.title) && Boolean(r.url))
            .slice(0, 2) as Array<{ title: string; url: string }>
        : undefined;
      const existing = driversMap.get(key);
      if (existing) {
        driversMap.set(key, {
          name,
          description: String(b.description || existing.description || ''),
          references: cleanedRefs || existing.references,
        });
      } else {
        driversMap.set(key, {
          name,
          description: String(b.description || ''),
          references: cleanedRefs,
        });
      }
    }
    const beliefDriversMerged = Array.from(driversMap.values()).slice(0, 10);

    // Merge sources by URL
    const aiSources = ((aiOT.sources || []) as Array<{ url?: string; title?: string; source?: string }>).map((s) => ({
      url: String(s.url || ''),
      title: String(s.title || s.url || 'Source'),
      source: String(s.source || ''),
      credibility: s.url ? computeCredibilityFromUrl(String(s.url)) : 60,
    }));
    const mergedSources = uniqBy(
      [
        ...aiSources,
        ...((parsed.sources || []) as Array<{ url: string; title: string; credibility: number }>),
      ],
      (s) => s.url
    ).slice(0, 15);

    // Extract all links from content (markdown + bare URLs)
    const extractAllLinks = (text: string): Array<{ url: string; title?: string }> => {
      const links: Array<{ url: string; title?: string }> = [];
      // markdown links [title](url)
      const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
      let m: RegExpExecArray | null;
      while ((m = md.exec(text)) !== null) {
        links.push({ title: m[1], url: m[2] });
      }
      // bare URLs
      const bare = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![^\s]*\))/g;
      let b: RegExpExecArray | null;
      while ((b = bare.exec(text)) !== null) {
        const url = b[1];
        // skip if already added via markdown
        if (!links.some((l) => l.url === url)) {
          try {
            const u = new URL(url);
            links.push({ url, title: u.hostname.replace(/^www\./, '') });
          } catch {}
        }
      }
      // dedupe by url
      const seen = new Set<string>();
      return links.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
    };

    const allLinks = extractAllLinks(content).slice(0, 50);

    const merged = {
        originTracing: {
          hypothesizedOrigin: aiOT.originTracing?.hypothesizedOrigin ?? parsed.originTracing.hypothesizedOrigin ?? undefined,
          firstSeenDates: firstSeenDatesMerged.length ? firstSeenDatesMerged : undefined,
          evolutionSteps: evolutionStepsMerged.length ? evolutionStepsMerged : undefined,
          propagationPaths: propagationPathsMerged.length ? propagationPathsMerged : undefined,
        },
      beliefDrivers: beliefDriversMerged,
      sources: mergedSources,
      verdict: aiOT.verdict ?? parsed.verdict,
      content,
      claim: typeof aiOT.claim === 'string' ? aiOT.claim : undefined,
      allLinks,
    };

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate origin tracing data' },
      { status: 500 }
    );
  }
}


