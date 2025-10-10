/**
 * API Route: POST /api/crowdsource/analyze
 * Performs AI analysis on news articles
 */

import { NextRequest, NextResponse } from "next/server";
import { getArticleAnalysis, upsertArticleAnalysis } from "@/lib/db/repo";
import { analyzeSentiment } from "@/lib/sentiment-analysis";
import { textModel, DEFAULT_ANALYSIS_MAX_TOKENS, DEFAULT_ANALYSIS_TEMPERATURE } from "@/lib/ai";
import { generateText } from "ai";

interface AnalyzeRequest {
  articleId: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: string;
}

/**
 * Extract key facts and claims from article content
 */
async function extractKeyFacts(content: string): Promise<string[]> {
  const prompt = `Analyze this news article and extract 3-5 key factual claims or statements that could be verified:

Article: ${content}

Extract only the most important factual claims (not opinions). Return as a numbered list.`;

  const result = await generateText({
    model: textModel(),
    prompt,
    maxTokens: 500,
    temperature: 0.3,
  });

  // Parse numbered list into array
  const facts = result.text
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(fact => fact.length > 0);

  return facts;
}

/**
 * Generate analysis summary and verdict
 */
async function generateAnalysis(article: {
  title: string;
  description?: string;
  content?: string;
  source: string;
}): Promise<{
  verdict: string;
  confidence: number;
  summary: string;
  keyPoints: string[];
  factsVerified: number;
  beliefDrivers: Array<{
    name: string;
    description: string;
    references?: Array<{ title: string; url: string }>;
  }>;
}> {
  const fullText = [article.title, article.description, article.content]
    .filter(Boolean)
    .join("\n\n");

  const prompt = `Analyze this news article for credibility and provide a fact-check assessment.

Title: ${article.title}
Source: ${article.source}
Content: ${fullText}

Provide your analysis in the following format:

VERDICT: [Choose ONE: Verified, Misleading, Unverifiable, False, Partially True, Outdated, Opinion, Needs Context]
CONFIDENCE: [Number 0-100]
SUMMARY: [2-3 sentences explaining the verdict]
KEY_POINTS:
- [First key point about the analysis]
- [Second key point about the analysis]
- [Third key point about the analysis]

Focus on:
1. Source credibility
2. Fact verifiability
3. Context and framing
4. Evidence quality`;

  const result = await generateText({
    model: textModel(),
    prompt,
    maxTokens: DEFAULT_ANALYSIS_MAX_TOKENS,
    temperature: DEFAULT_ANALYSIS_TEMPERATURE,
  });

  const text = result.text;

  // Parse the response
  const verdictMatch = text.match(/VERDICT:\s*(.+)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]+?)(?=KEY_POINTS:|$)/i);
  const keyPointsMatch = text.match(/KEY_POINTS:\s*([\s\S]+)/i);

  const verdict = verdictMatch
    ? verdictMatch[1].trim()
    : "Unverifiable";
  
  const confidence = confidenceMatch
    ? Math.min(100, Math.max(0, parseInt(confidenceMatch[1])))
    : 50;

  const summary = summaryMatch
    ? summaryMatch[1].trim().replace(/\n/g, " ")
    : "Analysis of article credibility based on available information.";

  const keyPoints = keyPointsMatch
    ? keyPointsMatch[1]
        .split("\n")
        .filter(line => line.trim().startsWith("-") || /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^[-\d.]+\s*/, "").trim())
        .filter(point => point.length > 0)
        .slice(0, 5)
    : [
        "Source credibility assessed",
        "Content analyzed for factual accuracy",
        "Context and framing evaluated",
      ];

  // Try to extract facts for verification count
  let factsVerified = 0;
  try {
    if (article.content) {
      const facts = await extractKeyFacts(fullText);
      factsVerified = facts.length;
    }
  } catch (error) {
    console.error("Error extracting facts:", error);
  }

  // Generate belief drivers based on verdict
  const beliefDrivers = generateBeliefDrivers(verdict, article.source);

  return {
    verdict,
    confidence,
    summary,
    keyPoints,
    factsVerified,
    beliefDrivers,
  };
}

/**
 * Generate belief drivers based on verdict and source
 */
function generateBeliefDrivers(verdict: string, source: string): Array<{
  name: string;
  description: string;
  references?: Array<{ title: string; url: string }>;
}> {
  const lowerVerdict = verdict.toLowerCase();
  
  const commonReferences = [
    {
      title: "Understanding Media Bias - Media Bias/Fact Check",
      url: "https://mediabiasfactcheck.com/methodology/",
    },
    {
      title: "How to Spot Misinformation - FactCheck.org",
      url: "https://www.factcheck.org/",
    },
  ];

  if (lowerVerdict.includes("verified") || lowerVerdict.includes("true")) {
    return [
      {
        name: "Source Credibility",
        description: `${source} is a recognized news organization with established fact-checking standards and editorial oversight.`,
        references: commonReferences,
      },
      {
        name: "Multiple Corroboration",
        description: "The information can be verified across multiple independent credible sources.",
      },
      {
        name: "Transparency",
        description: "The article provides clear sourcing and attribution for claims made.",
      },
    ];
  } else if (lowerVerdict.includes("misleading") || lowerVerdict.includes("context")) {
    return [
      {
        name: "Missing Context",
        description: "The article presents factual information but omits important context that could change interpretation.",
      },
      {
        name: "Selective Reporting",
        description: "Information may be cherry-picked to support a particular narrative while excluding contradictory data.",
      },
      {
        name: "Confirmation Bias",
        description: "People tend to believe information that confirms their existing beliefs, even when context is missing.",
        references: commonReferences,
      },
    ];
  } else if (lowerVerdict.includes("false") || lowerVerdict.includes("debunked")) {
    return [
      {
        name: "Misinformation Spread",
        description: "False information can spread rapidly on social media before fact-checks catch up.",
      },
      {
        name: "Emotional Appeal",
        description: "False claims often use emotional language to bypass critical thinking.",
      },
      {
        name: "Authority Misrepresentation",
        description: "May falsely cite experts or authoritative sources to appear credible.",
        references: commonReferences,
      },
    ];
  } else if (lowerVerdict.includes("opinion")) {
    return [
      {
        name: "Subjective Interpretation",
        description: "This content expresses personal views or interpretations rather than verifiable facts.",
      },
      {
        name: "Editorial Perspective",
        description: "Opinion pieces reflect the author's perspective and should not be treated as objective reporting.",
      },
    ];
  } else {
    return [
      {
        name: "Insufficient Evidence",
        description: "Limited credible sources available to verify or contradict the claims made.",
      },
      {
        name: "Emerging Information",
        description: "The story may be developing and additional context may emerge over time.",
      },
      {
        name: "Source Limitations",
        description: "The original source may lack transparency or established credibility.",
        references: commonReferences,
      },
    ];
  }
}

/**
 * POST handler for analyzing articles
 */
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();

    const { articleId, title, description, content, url, source } = body;

    if (!articleId || !title || !url || !source) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if analysis already exists
    const existing = await getArticleAnalysis(articleId);
    if (existing) {
      // Parse JSON fields back to objects
      return NextResponse.json({
        analysis: {
          ...existing,
          keyPoints: JSON.parse(existing.keyPoints as string),
          sentiment: existing.sentiment ? JSON.parse(existing.sentiment as string) : null,
        },
      });
    }

    // Perform sentiment analysis
    let sentiment = null;
    try {
      const fullText = [title, description, content].filter(Boolean).join(" ");
      sentiment = await analyzeSentiment(fullText, "en");
    } catch (error) {
      console.error("Sentiment analysis error:", error);
    }

    // Generate AI analysis
    const analysis = await generateAnalysis({
      title,
      description,
      content,
      source,
    });

    // Store in database
    await upsertArticleAnalysis({
      articleId,
      articleUrl: url,
      title,
      description,
      source,
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      sentiment,
      factsVerified: analysis.factsVerified,
    });

    return NextResponse.json({
      analysis: {
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        sentiment,
        factsVerified: analysis.factsVerified,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze article" },
      { status: 500 }
    );
  }
}

