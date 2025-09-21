import { logger } from "../../../../lib/logger";

/**
 * Transcription result interface
 */
export interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language?: string;
}

/**
 * Extracted content data interface
 */
export interface ExtractedContent {
  title?: string;
  description?: string;
  creator?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  shareCount?: number;
  publishedAt?: string;
  [key: string]: unknown; // Allow additional platform-specific properties
}

/**
 * Fact check result interface
 */
export interface FactCheckResult {
  verdict: "verified" | "misleading" | "false" | "unverified" | "satire";
  confidence: number; // 0-100
  explanation: string;
  content: string; // Summary/content of what was fact-checked
  sources: Array<{
    url: string;
    title: string;
    credibility: number;
  }>;
  flags: string[];

  originTracing?: {
    hypothesizedOrigin?: string; // Where the claim likely originated (with citations if possible)
    firstSeenDates?: Array<{ source: string; date?: string; url?: string }>; // timeline hints
    propagationPaths?: string[]; // e.g., social platforms, forums, influencers
  };
  beliefDrivers?: Array<{
    name: string; // e.g., confirmation bias, availability heuristic, motivated reasoning
    description: string; // brief, user-friendly explanation
    references?: Array<{ title: string; url: string }>; // practical articles explaining similar cases
  }>;
  // NEW: Political bias analysis
  politicalBias?: {
    biasDirection: "left" | "right" | "center" | "none";
    biasIntensity: number; // 0-1 scale
    confidence: number; // 0-1 scale
    explanation: string;
    biasIndicators: string[];
    politicalTopics: string[];
  };
}

/**
 * Base interface for all platform analysis results
 */
export interface BaseAnalysisResult {
  transcription: TranscriptionResult;
  metadata: {
    title: string;
    description: string;
    creator: string;
    originalUrl: string;
    platform: string;
  };
  factCheck: FactCheckResult | null;
  requiresFactCheck: boolean;
  creatorCredibilityRating: number | null;
  originTracingData?: any; // Origin tracing diagram data
}

/**
 * Base context for request processing
 */
export interface ProcessingContext {
  requestId: string;
  userId?: string;
  platform: string;
  url: string;
  startTime: number;
}

/**
 * Abstract base handler for platform-specific content processing
 *
 * This class provides common functionality that all platform handlers need:
 * - Logging with context
 * - Error handling
 * - Timeout management
 * - Performance tracking
 */
export abstract class BaseHandler {
  protected readonly platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  /**
   * Main entry point for processing content
   * @param url - The URL to process
   * @param context - Processing context with request info
   * @returns Promise<BaseAnalysisResult>
   */
  async process(
    url: string,
    context: ProcessingContext
  ): Promise<BaseAnalysisResult> {
    const startTime = Date.now();

    logger.info(`Starting ${this.platform} analysis`, {
      requestId: context.requestId,
      platform: this.platform,
      operation: "process",
      metadata: { url },
    });

    try {
      // Step 1: Extract content from platform
      const extractedData = await this.measureOperation(
        "content-extraction",
        () => this.extractContent(url, context),
        context
      );

      // Step 2: Transcribe if there's video content
      const transcription = await this.measureOperation(
        "transcription",
        () => this.transcribeContent(extractedData, context),
        context
      );

      // Step 3: Fact-check the content
      const factCheck = await this.measureOperation(
        "fact-checking",
        () => this.performFactCheck(transcription, extractedData, context),
        context
      );

      // Step 4: Calculate creator credibility
      const credibilityRating = await this.measureOperation(
        "credibility-rating",
        () => this.calculateCredibility(factCheck, extractedData, context),
        context
      );

      // Step 5: Generate origin tracing diagram data if fact-check was performed
      let originTracingData = null;
      if (factCheck && (factCheck.explanation || factCheck.content)) {
        try {
          // Import and call the origin tracing logic directly
          const { parseOriginTracing, computeCredibilityFromUrl } =
            await import("@/lib/analysis/parseOriginTracing");
          const { generateText } = await import("ai");
          const { textModel } = await import("@/lib/ai");

          const content = factCheck.explanation || factCheck.content || "";
          const parsed = parseOriginTracing(content);

          // AI enhancement for richer data
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

          let ai: any = null;
          try {
            const { text } = await generateText({
              model: textModel(),
              system:
                "Extract structured origin-tracing data for visualization. Be precise and grounded in the text.",
              prompt,
              maxTokens: Math.max(2000, 4000),
              temperature: 0.1,
            });
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            if (start !== -1 && end !== -1) {
              ai = JSON.parse(text.slice(start, end + 1));
            }
          } catch {}

          // Merge AI and parsed data like in the API route
          const aiOT: any = ai ?? {};
          const uniqBy = <T, K extends string | number>(
            items: T[],
            keyFn: (t: T) => K
          ) => {
            const map = new Map<K, T>();
            for (const it of items) {
              const k = keyFn(it);
              if (!map.has(k)) map.set(k, it);
            }
            return Array.from(map.values());
          };

          const firstSeenDatesMerged = uniqBy(
            [
              ...((aiOT.originTracing?.firstSeenDates || []) as Array<{
                source: string;
                date?: string;
                url?: string;
              }>),
              ...((parsed.originTracing.firstSeenDates || []) as Array<{
                source: string;
                date?: string;
                url?: string;
              }>),
            ],
            (d) =>
              `${(d.source || "").toLowerCase()}|${d.date || ""}|${d.url || ""}`
          ).slice(0, 15);

          const evolutionStepsMerged = [
            ...((aiOT.originTracing?.evolutionSteps || []) as Array<{
              platform: string;
              transformation: string;
              impact?: string;
              date?: string;
            }>),
            ...((parsed.originTracing.propagationPaths || []).map(
              (path: string) => ({
                platform: path,
                transformation: `Content spread through ${path}`,
              })
            ) as Array<{ platform: string; transformation: string }>),
          ].slice(0, 10);

          const propagationPathsMerged = Array.from(
            new Set<string>(
              [
                ...((aiOT.originTracing?.propagationPaths || []) as string[]),
                ...((parsed.originTracing.propagationPaths || []) as string[]),
              ].map((s) => String(s))
            )
          ).slice(0, 15);

          // Extract all links
          const extractAllLinks = (
            text: string
          ): Array<{ url: string; title?: string }> => {
            const links: Array<{ url: string; title?: string }> = [];
            const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
            let m: RegExpExecArray | null;
            while ((m = md.exec(text)) !== null) {
              links.push({ title: m[1], url: m[2] });
            }
            const bare =
              /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![^\s]*\))/g;
            let b: RegExpExecArray | null;
            while ((b = bare.exec(text)) !== null) {
              const url = b[1];
              if (!links.some((l) => l.url === url)) {
                try {
                  const u = new URL(url);
                  links.push({ url, title: u.hostname.replace(/^www\./, "") });
                } catch {}
              }
            }
            const seen = new Set<string>();
            return links.filter((l) =>
              seen.has(l.url) ? false : (seen.add(l.url), true)
            );
          };

          originTracingData = {
            originTracing: {
              hypothesizedOrigin:
                aiOT.originTracing?.hypothesizedOrigin ??
                parsed.originTracing.hypothesizedOrigin ??
                undefined,
              firstSeenDates: firstSeenDatesMerged.length
                ? firstSeenDatesMerged
                : undefined,
              evolutionSteps: evolutionStepsMerged.length
                ? evolutionStepsMerged
                : undefined,
              propagationPaths: propagationPathsMerged.length
                ? propagationPathsMerged
                : undefined,
            },
            beliefDrivers:
              Array.isArray(aiOT.beliefDrivers) && aiOT.beliefDrivers.length
                ? aiOT.beliefDrivers.slice(0, 10)
                : parsed.beliefDrivers.slice(0, 10),
            sources:
              Array.isArray(aiOT.sources) && aiOT.sources.length
                ? aiOT.sources
                    .map((s: any) => ({
                      url: String(s.url || ""),
                      title: String(s.title || s.url || "Source"),
                      source: String(s.source || ""),
                      credibility: s.url
                        ? computeCredibilityFromUrl(String(s.url))
                        : 60,
                    }))
                    .slice(0, 15)
                : parsed.sources.slice(0, 15),
            verdict: aiOT.verdict ?? parsed.verdict,
            content,
            claim: typeof aiOT.claim === "string" ? aiOT.claim : undefined,
            allLinks: extractAllLinks(content).slice(0, 50),
          };

          logger.info("Origin tracing data generated", {
            requestId: context.requestId,
            platform: this.platform,
            operation: "origin-tracing",
            metadata: {
              hasOrigin: !!originTracingData?.originTracing?.hypothesizedOrigin,
              beliefDriversCount: originTracingData?.beliefDrivers?.length || 0,
              sourcesCount: originTracingData?.sources?.length || 0,
              allLinksCount: originTracingData?.allLinks?.length || 0,
            },
          });
        } catch (error) {
          logger.warn("Failed to generate origin tracing data", {
            requestId: context.requestId,
            platform: this.platform,
            operation: "origin-tracing",
            metadata: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      }

      const result: BaseAnalysisResult = {
        transcription: transcription || {
          text: "",
          segments: [],
          language: undefined,
        },
        metadata: {
          title: extractedData?.title || `${this.platform} Content`,
          description: extractedData?.description || "",
          creator: extractedData?.creator || "Unknown",
          originalUrl: url,
          platform: this.platform,
        },
        factCheck,
        requiresFactCheck: !!factCheck,
        creatorCredibilityRating: credibilityRating,
        originTracingData,
      };

      const duration = Date.now() - startTime;
      logger.info(`${this.platform} analysis completed`, {
        requestId: context.requestId,
        platform: this.platform,
        operation: "process",
        duration,
        metadata: {
          hasTranscription: !!transcription?.text,
          hasFactCheck: !!factCheck,
          hasCredibilityRating: credibilityRating !== null,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `${this.platform} analysis failed`,
        {
          requestId: context.requestId,
          platform: this.platform,
          operation: "process",
          duration,
        },
        error as Error
      );

      throw error;
    }
  }

  /**
   * Measure the performance of an operation
   */
  protected async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: ProcessingContext
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      logger.debug(`${operationName} completed`, {
        requestId: context.requestId,
        platform: this.platform,
        operation: operationName,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.warn(`${operationName} failed`, {
        requestId: context.requestId,
        platform: this.platform,
        operation: operationName,
        duration,
        metadata: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  // Abstract methods that each platform must implement
  protected abstract extractContent(
    url: string,
    context: ProcessingContext
  ): Promise<ExtractedContent | null>;

  protected abstract transcribeContent(
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<TranscriptionResult | null>;

  protected abstract performFactCheck(
    transcription: TranscriptionResult | null,
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<FactCheckResult | null>;

  protected abstract calculateCredibility(
    factCheck: FactCheckResult | null,
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<number | null>;
}
