import { tool, generateText } from "ai";
import { z } from "zod";
import {
  textModel,
  DEFAULT_QUERY_MAX_TOKENS,
  DEFAULT_QUERY_TEMPERATURE,
  DEFAULT_ANALYSIS_MAX_TOKENS,
  DEFAULT_ANALYSIS_TEMPERATURE,
} from "../../lib/ai";
import { evaluateDomainCredibility } from "./domain-credibility";
import { analyzeVerificationStatus } from "./verification-analysis";

/**
 * Represents a search result from the Exa Search API.
 * Used for initial URL discovery and basic metadata.
 */
interface ExaSearchResult {
  /** The URL of the found webpage */
  url: string;
  /** Title of the webpage (if available) */
  title?: string;
  /** Relevance score from Exa's ranking algorithm (0-1) */
  score?: number;
  /** Brief text excerpt from the page (limited content) */
  text?: string;
  /** AI-generated summary of the page content */
  summary?: string;
  /** Key highlighted phrases from the content */
  highlights?: string[];
  /** Publication date in ISO format */
  publishedDate?: string;
}

/**
 * Represents detailed content from the Exa Get Contents API.
 * Provides full page content for comprehensive analysis.
 */
interface ExaContentResult {
  /** The URL of the webpage */
  url: string;
  /** Title of the webpage */
  title?: string;
  /** Full text content of the page (up to API limits) */
  text?: string;
  /** AI-generated summary of the full content */
  summary?: string;
  /** Key highlighted phrases from the full content */
  highlights?: string[];
  /** Publication date in ISO format */
  publishedDate?: string;
}

/**
 * Advanced web research and fact-checking tool using Exa API and OpenAI.
 *
 * This tool performs comprehensive fact-checking by:
 * 1. Generating optimized search queries using GPT
 * 2. Finding relevant sources via Exa Search API
 * 3. Retrieving full content using Exa Get Contents API
 * 4. Analyzing content with AI for verification
 * 5. Determining overall truthfulness and confidence
 *
 * @requires EXA_API_KEY environment variable
 * @requires AWS_REGION environment variable (for Bedrock)
 *
 * @example
 * ```typescript
 * const result = await researchAndFactCheck.execute({
 *   transcription: "Vaccines cause autism in children",
 *   title: "Medical Claims Video",
 *   context: "Social media post with health claims"
 * });
 *
 * console.log(result.data.overallStatus); // "misleading"
 * console.log(result.data.confidence); // 0.9
 * console.log(result.data.sources.length); // 5
 * ```
 */
export const researchAndFactCheck = tool({
  description:
    "Search the web using Exa API to verify content and determine if it's verified, misleading, or unverifiable",
  parameters: z.object({
    transcription: z.string().describe("The transcribed content to verify"),
    title: z.string().optional().describe("The video title for context"),
    context: z
      .string()
      .optional()
      .describe("Additional context about the video content"),
  }),
  execute: async ({ transcription, title, context }) => {
    // Check if required API keys are available
    if (!process.env.EXA_API_KEY) {
      return {
        success: false,
        error: "Exa API key not configured",
      };
    }

    // Model configuration is centralized in lib/ai.ts (throws if misconfigured)

    try {
      /**
       * STEP 1: AI-Powered Query Generation
       * Uses GPT to analyze the content and generate an optimal search query
       * that will find the most relevant fact-checking and news sources.
       */
      const searchQueryPrompt = `You are an expert fact-checker. Create an optimal search query to find credible sources and fact-check the following content. The query should be designed to find reliable news sources, fact-checking websites, and official sources that can verify or debunk the claims made. If the content appears to be misinformation, ensure queries will help identify the origin of the claim and reputable analyses of why people believe it.

Content to fact-check:
Title: ${title || "N/A"}
Transcription: ${transcription}
${context ? `Context: ${context}` : ""}

Create a focused search query (max 50 words) that will help find:
1. Credible news articles about this topic
2. Fact-checking reports
3. Official sources or statements
4. Expert analysis

Return only the search query, nothing else.`;

      const { text: searchQuery } = await generateText({
        model: textModel(),
        system:
          "You are an expert at creating search queries for fact-checking. Create concise, effective search queries that will find the most relevant and credible sources.",
        prompt: searchQueryPrompt,
        maxTokens: DEFAULT_QUERY_MAX_TOKENS,
        temperature: DEFAULT_QUERY_TEMPERATURE,
      });

      /**
       * STEP 2: URL Discovery via Exa Search
       * Searches the web using the AI-generated query to find relevant URLs.
       * This step focuses on finding sources rather than retrieving content.
       */
      const searchResponse = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "x-api-key": process.env.EXA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          numResults: 10,
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(
          `Exa Search API error: ${searchResponse.status} ${searchResponse.statusText}`
        );
      }

      const searchData = await searchResponse.json();
      const searchResults = searchData.results || [];

      /**
       * Extract and prioritize URLs for detailed content retrieval.
       * Limits to top 5 results to balance comprehensive analysis with API costs.
       */
      const urlsToFetch = searchResults
        .filter((result: ExaSearchResult) => result.url)
        .slice(0, 5) // Limit to top 5 results for cost efficiency
        .map((result: ExaSearchResult) => result.url);

      /**
       * STEP 3: Content Retrieval via Exa Get Contents
       * Fetches full page content, summaries, and highlights for analysis.
       * This provides the detailed information needed for fact-checking.
       */
      let contentResults: ExaContentResult[] = [];
      if (urlsToFetch.length > 0) {
        const contentsResponse = await fetch("https://api.exa.ai/contents", {
          method: "POST",
          headers: {
            "x-api-key": process.env.EXA_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urls: urlsToFetch,
            text: true,
            summary: true,
            highlights: true,
          }),
        });

        if (contentsResponse.ok) {
          const contentsData = await contentsResponse.json();
          contentResults = contentsData.results || [];
        } else {
          console.warn(
            `Exa Contents API error: ${contentsResponse.status} ${contentsResponse.statusText}`
          );
        }
      }

      /**
       * STEP 4: Source Processing and Content Aggregation
       * Combines search metadata with full content, evaluates source credibility,
       * and aggregates all information for AI analysis.
       */
      const extractedSources: Array<{
        title: string;
        url: string;
        source: string;
        relevance: number;
        description: string;
      }> = [];

      let searchContent = "";

      // Process search results with enhanced content from contents API
      for (const result of searchResults) {
        if (result.url) {
          try {
            const hostname = new URL(result.url).hostname;
            const credibilityScore = await evaluateDomainCredibility(hostname);
            const relevance = Math.min(
              credibilityScore / 10,
              result.score || 0.5
            );
            const isHighlyCredible = credibilityScore >= 8;

            extractedSources.push({
              title: result.title || `Source from ${hostname}`,
              url: result.url,
              source: hostname,
              relevance: relevance,
              description: isHighlyCredible
                ? "Credible news/fact-checking source"
                : "Web source from search results",
            });

            // Find corresponding content from contents API
            const contentResult = contentResults.find(
              (content: ExaContentResult) => content.url === result.url
            );

            // Aggregate content for analysis with full content when available
            searchContent += `\n\nSource: ${
              result.title || "Untitled"
            } (${hostname})`;

            if (contentResult) {
              if (contentResult.text) {
                searchContent += `\nFull Content: ${contentResult.text.substring(
                  0,
                  2000
                )}`;
              }
              if (contentResult.summary) {
                searchContent += `\nSummary: ${contentResult.summary}`;
              }
              if (
                contentResult.highlights &&
                contentResult.highlights.length > 0
              ) {
                searchContent += `\nHighlights: ${contentResult.highlights.join(
                  "; "
                )}`;
              }
              if (contentResult.publishedDate) {
                searchContent += `\nPublished: ${contentResult.publishedDate}`;
              }
            } else {
              // Fallback to search result data if content retrieval failed
              if (result.text) {
                searchContent += `\nContent: ${result.text.substring(0, 1000)}`;
              }
              if (result.summary) {
                searchContent += `\nSummary: ${result.summary}`;
              }
            }
          } catch (error) {
            console.warn(
              "Failed to process Exa result URL:",
              result.url,
              error
            );
          }
        }
      }

      /**
       * Prioritize sources by credibility and relevance for fact-checking.
       * Higher relevance scores indicate more credible and relevant sources.
       */
      extractedSources.sort((a, b) => b.relevance - a.relevance);

      /**
       * STEP 5: AI-Powered Fact-Check Analysis
       * Uses GPT to analyze all gathered content against the original claims,
       * providing detailed verification with supporting evidence.
       */
      let factCheckAnalysis = "";
      if (searchContent.trim()) {
        const factCheckPrompt = `You are a fact-checker analyzing content against credible sources. Your analysis will be structured to populate the following UI sections in order:

1. **DETAILED ANALYSIS SECTION**: Core fact-checking findings and evidence
2. **SOURCES SECTION**: Information about sources used (handled separately)
3. **ORIGIN TRACING SECTION**: Investigation of claim origins and propagation
4. **BELIEF DRIVERS SECTION**: Psychology behind why people believe this

Content to verify:
Title: ${title || "N/A"}
Transcription: ${transcription}
${context ? `Context: ${context}` : ""}

Credible sources found:
${searchContent}

Please provide a comprehensive fact-check analysis structured as follows:

**FOR THE DETAILED ANALYSIS SECTION (displayed first):**
1. Overall verification status (verified/misleading/unverifiable)
2. Evidence from the credible sources provided
3. Specific claims that are accurate or inaccurate
4. Reasoning behind your assessment
5. Any biases or credibility concerns
6. Comprehensive analysis of the evidence

**FOR THE ORIGIN TRACING SECTION (displayed after sources):**
If the content is false, misleading, or contains dubious claims, provide detailed:
- Likely origin of the claim (with earliest known appearances, links, or citations)
- How the claim evolved and spread across platforms
- Specific transformations of the narrative on different platforms
- Timeline of propagation if identifiable
- Key moments in the claim's evolution

**FOR THE BELIEF DRIVERS SECTION (displayed after origin tracing):**
Psychology/science-backed reasons why people might believe this content:
- Cognitive biases at play (e.g., confirmation bias, motivated reasoning)
- Narrative appeal and emotional triggers
- Social and cultural factors
- Academic references where possible

Format your response clearly with these sections:
- **Conclusion and Summary** (for Detailed Analysis section)
- **Evidence Analysis** (for Detailed Analysis section)
- **Source Credibility Assessment** (for Detailed Analysis section)
- **Reasoning and Methodology** (for Detailed Analysis section)
`;
// - **Origin Tracing Investigation** (separate section - detailed investigation of claim origins, evolution, and propagation)
// - **Why People Believe This** (separate section - psychological drivers with scientific references)

        const { text } = await generateText({
          model: textModel(),
          system:
            "You are an expert fact-checker who analyzes content against credible sources to determine truthfulness and accuracy.",
          prompt: factCheckPrompt,
          maxTokens: DEFAULT_ANALYSIS_MAX_TOKENS,
          temperature: DEFAULT_ANALYSIS_TEMPERATURE,
        });

        factCheckAnalysis = text;
      }

      /**
       * STEP 6: Final Verification Assessment
       * Determines overall verification status (verified/misleading/unverifiable)
       * and confidence level based on the comprehensive analysis.
       */
      const { status, confidence } = await analyzeVerificationStatus(
        transcription,
        factCheckAnalysis || searchContent
      );

      /**
       * Return comprehensive fact-check results with:
       * - Overall verification status and confidence
       * - Detailed analysis and reasoning
       * - Credible source information
       * - Search metadata and statistics
       */
      return {
        success: true,
        data: {
          overallStatus: status,
          confidence: confidence,
          isVerified: status === "verified",
          isMisleading: status === "misleading",
          isUnverifiable: status === "unverifiable",
          webSearchAnalysis: {
            summary:
              (factCheckAnalysis || searchContent).substring(0, 500) +
              ((factCheckAnalysis || searchContent).length > 500 ? "..." : ""),
            fullAnalysis: factCheckAnalysis || searchContent,
            sourcesFound: extractedSources.length,
            webSourcesUsed: extractedSources.length > 0,
            primarySources: extractedSources.slice(0, 5).map((source) => ({
              title: source.title,
              url: source.url,
              source: source.source,
            })),
          },
          sources: extractedSources,
          credibleSourcesCount: extractedSources.filter(
            (s) => s.relevance > 0.7
          ).length,
          reasoning: factCheckAnalysis || searchContent,
          // New structured fields derived via lightweight extraction prompts later in handlers
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to verify content",
        data: {
          overallStatus: "unverifiable",
          confidence: 0,
          isVerified: false,
          isMisleading: false,
          isUnverifiable: true,
          sources: [],
          credibleSourcesCount: 0,
          reasoning: "Error occurred during verification",
        },
      };
    }
  },
});
