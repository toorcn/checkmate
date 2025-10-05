/**
 * API Route: GET /api/crowdsource/news
 * Fetches news articles from GNews API with fake analysis data
 */

import { NextResponse } from "next/server";

// Free news API - GNews (you can also use NewsAPI, TheNewsAPI, etc.)
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "demo"; // Use 'demo' for testing
const GNEWS_API_URL = "https://gnews.io/api/v4/top-headlines";

/**
 * Generate fake analysis for a news article
 */
function generateFakeAnalysis() {
  const verdicts = ["Verified", "Misleading", "Unverifiable", "False"] as const;
  const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

  const summaries = {
    Verified:
      "Our AI analysis indicates this article contains factually accurate information supported by credible sources.",
    Misleading:
      "This article contains some factual elements but presents them in a misleading context or omits key information.",
    Unverifiable:
      "The claims in this article cannot be verified with available information and credible sources.",
    False:
      "Our analysis has identified multiple factual errors and unsubstantiated claims in this article.",
  };

  const keyPointsOptions = [
    [
      "Source has a history of accurate reporting",
      "Claims are supported by official statements",
      "Multiple independent sources confirm the information",
    ],
    [
      "Context is missing from the headline",
      "Some statistics are presented without proper context",
      "Emotional language used to influence readers",
    ],
    [
      "Original sources could not be verified",
      "Claims require additional fact-checking",
      "Limited information available for verification",
    ],
    [
      "Multiple factual errors identified",
      "Sources cited are not credible",
      "Information contradicts verified data",
    ],
  ];

  const keyPoints = keyPointsOptions[verdicts.indexOf(verdict)];

  return {
    verdict,
    confidence,
    summary: summaries[verdict],
    keyPoints,
  };
}

/**
 * GET handler for fetching news articles
 */
export async function GET() {
  try {
    // Using GNews API - you can also use NewsAPI or any other free news API
    // For production, use environment variable: process.env.GNEWS_API_KEY
    const url = `${GNEWS_API_URL}?token=${GNEWS_API_KEY}&lang=en&max=10`;

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // If GNews fails, return mock data for demo purposes
      return NextResponse.json({
        articles: generateMockArticles(),
      });
    }

    const data = await response.json();

    // Transform articles to include voting data and fake analysis
    const articles = data.articles.map((article: any, index: number) => ({
      id: `article-${Date.now()}-${index}`,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.image,
      source: {
        id: article.source.name.toLowerCase().replace(/\s+/g, "-"),
        name: article.source.name,
      },
      author: article.source.name,
      publishedAt: article.publishedAt,
      content: article.content,
      votes: {
        credible: Math.floor(Math.random() * 100) + 20,
        notCredible: Math.floor(Math.random() * 50) + 5,
        unsure: Math.floor(Math.random() * 30) + 10,
      },
      analysis: generateFakeAnalysis(),
    }));

    return NextResponse.json({
      articles,
      total: articles.length,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    
    // Return mock data as fallback
    return NextResponse.json({
      articles: generateMockArticles(),
    });
  }
}

/**
 * Generate mock articles for demo/fallback
 */
function generateMockArticles() {
  return [
    {
      id: "mock-1",
      title: "Tech Giants Announce New AI Safety Standards",
      description:
        "Major technology companies have agreed on new safety standards for artificial intelligence development and deployment.",
      url: "https://example.com/article-1",
      urlToImage: "https://picsum.photos/seed/tech1/400/300",
      source: { id: "tech-news", name: "Tech News Daily" },
      author: "Sarah Johnson",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      content:
        "Leading technology companies have announced a joint initiative...",
      votes: { credible: 87, notCredible: 12, unsure: 23 },
      analysis: generateFakeAnalysis(),
    },
    {
      id: "mock-2",
      title: "Climate Summit Reaches Historic Agreement",
      description:
        "World leaders at the climate summit have reached a landmark agreement on reducing carbon emissions.",
      url: "https://example.com/article-2",
      urlToImage: "https://picsum.photos/seed/climate1/400/300",
      source: { id: "world-news", name: "World News Network" },
      author: "Michael Chen",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      content: "After days of intense negotiations, world leaders have...",
      votes: { credible: 124, notCredible: 8, unsure: 15 },
      analysis: generateFakeAnalysis(),
    },
    {
      id: "mock-3",
      title: "Breakthrough in Renewable Energy Storage",
      description:
        "Scientists have developed a new battery technology that could revolutionize renewable energy storage.",
      url: "https://example.com/article-3",
      urlToImage: "https://picsum.photos/seed/energy1/400/300",
      source: { id: "science-daily", name: "Science Daily" },
      author: "Dr. Emily Rodriguez",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      content: "A team of researchers has announced a major breakthrough...",
      votes: { credible: 156, notCredible: 5, unsure: 19 },
      analysis: generateFakeAnalysis(),
    },
    {
      id: "mock-4",
      title: "Global Markets React to Economic Policy Changes",
      description:
        "Stock markets worldwide show mixed reactions to new economic policies announced by central banks.",
      url: "https://example.com/article-4",
      urlToImage: "https://picsum.photos/seed/finance1/400/300",
      source: { id: "financial-times", name: "Financial Times" },
      author: "Robert Williams",
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      content: "Global financial markets experienced volatility today...",
      votes: { credible: 98, notCredible: 23, unsure: 34 },
      analysis: generateFakeAnalysis(),
    },
    {
      id: "mock-5",
      title: "New Study Reveals Impact of Social Media on Mental Health",
      description:
        "Researchers publish comprehensive study on the effects of social media usage on adolescent mental health.",
      url: "https://example.com/article-5",
      urlToImage: "https://picsum.photos/seed/health1/400/300",
      source: { id: "health-news", name: "Health News Today" },
      author: "Dr. Amanda Lee",
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      content: "A new study published in a leading medical journal...",
      votes: { credible: 134, notCredible: 18, unsure: 28 },
      analysis: generateFakeAnalysis(),
    },
  ];
}
