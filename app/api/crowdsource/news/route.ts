/**
 * API Route: GET /api/crowdsource/news
 * Fetches news articles from GNews API with fake analysis data
 */

import { NextResponse } from "next/server";

// Free news API - NewsAPI (free tier: 1000 requests/day)
const NEWS_API_KEY = process.env.NEWS_API_KEY || "your-newsapi-key-here";
const NEWS_API_URL = "https://newsapi.org/v2/top-headlines";

// Fallback: Guardian API (free, no key required for limited requests)
const GUARDIAN_API_URL = "https://content.guardianapis.com/search";

// Cache for articles to maintain stable IDs
let cachedArticles: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate fake analysis for a news article
 */
function generateFakeAnalysis() {
  const verdicts = ["Verified", "Misleading", "Unverifiable", "False", "Partially True", "Outdated", "Exaggerated", "Opinion", "Rumor", "Conspiracy", "Debunked", "Satire"] as const;
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
    "Partially True":
      "This article contains both accurate and inaccurate elements. Some claims are supported by evidence while others are not.",
    Outdated:
      "This information was accurate at one time but has been superseded by newer evidence or developments.",
    Exaggerated:
      "While based on some truth, this article overstates or sensationalizes the facts beyond what evidence supports.",
    Opinion:
      "This article expresses subjective views or personal beliefs rather than factual claims that can be verified.",
    Rumor:
      "This appears to be unverified information circulating without credible sources or confirmation.",
    Conspiracy:
      "This article involves claims about secret plots or hidden agendas without credible evidence to support them.",
    Debunked:
      "This claim has been thoroughly disproven by multiple credible sources and scientific evidence.",
    Satire:
      "This article appears to be satirical, parody, or comedy in nature and should not be interpreted as factual information.",
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
    [
      "Some claims are accurate while others are false",
      "Mixed evidence supports different parts of the story",
      "Requires careful distinction between true and false elements",
    ],
    [
      "Information was accurate when originally published",
      "New developments have changed the situation",
      "Readers should seek updated information",
    ],
    [
      "Core facts are true but overstated",
      "Statistics are inflated beyond actual data",
      "Sensational language exaggerates the significance",
    ],
    [
      "Content expresses personal views",
      "Not intended as factual reporting",
      "Subjective interpretation of events",
    ],
    [
      "Unverified information circulating",
      "No credible sources confirm the claims",
      "Appears to be speculation or hearsay",
    ],
    [
      "Claims involve secretive plots",
      "No credible evidence supports conspiracy theories",
      "Multiple sources have debunked these claims",
    ],
    [
      "Scientific evidence contradicts the claims",
      "Multiple studies have disproven this theory",
      "Expert consensus rejects these assertions",
    ],
    [
      "Content is intended as humor or parody",
      "Not meant to be taken as factual information",
      "Comedic elements should not be interpreted literally",
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
    // Check if we have cached articles that are still valid
    const now = Date.now();
    if (cachedArticles && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        articles: cachedArticles,
        total: cachedArticles.length,
      });
    }

    // Using NewsAPI - free tier with 1000 requests/day
    // Get your free API key at: https://newsapi.org/register
    const url = `${NEWS_API_URL}?apiKey=${NEWS_API_KEY}&country=us&pageSize=10`;

    console.log("Fetching news from:", url.replace(NEWS_API_KEY, "***"));

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    console.log("NewsAPI response status:", response.status);

    if (!response.ok) {
      console.log("NewsAPI failed, trying Guardian API as fallback");
      
      // Try Guardian API as fallback
      try {
        const guardianUrl = `${GUARDIAN_API_URL}?api-key=${process.env.GUARDIAN_API_KEY || 'test'}&page-size=10&show-fields=thumbnail,trailText`;
        console.log("Trying Guardian API:", guardianUrl.replace(process.env.GUARDIAN_API_KEY || 'test', '***'));
        
        const guardianResponse = await fetch(guardianUrl);
        
        if (guardianResponse.ok) {
          const guardianData = await guardianResponse.json();
          console.log("Guardian API response:", guardianData);
          
          if (guardianData.response && guardianData.response.results) {
            const articles = guardianData.response.results.map((article: any, index: number) => ({
              id: `article-${Buffer.from(article.webTitle + article.webUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}-${index}`,
              title: article.webTitle,
              description: article.fields?.trailText || article.webTitle,
              url: article.webUrl,
              urlToImage: article.fields?.thumbnail,
              source: {
                id: "guardian",
                name: "The Guardian",
              },
              author: "The Guardian",
              publishedAt: article.webPublicationDate,
              content: article.fields?.trailText || article.webTitle,
              votes: {
                credible: Math.floor(Math.random() * 100) + 20,
                notCredible: Math.floor(Math.random() * 50) + 5,
                unsure: Math.floor(Math.random() * 30) + 10,
              },
              analysis: generateFakeAnalysis(),
            }));
            
            console.log("Guardian articles count:", articles.length);
            
            // Cache the articles
            cachedArticles = articles;
            cacheTimestamp = now;
            
            return NextResponse.json({
              articles,
              total: articles.length,
            });
          }
        }
      } catch (guardianError) {
        console.log("Guardian API also failed:", guardianError);
      }
      
      // If both APIs fail, return empty array
      cachedArticles = [];
      cacheTimestamp = now;
      
      return NextResponse.json({
        articles: [],
        total: 0,
      });
    }

    const data = await response.json();
    console.log("NewsAPI response data:", data);

    if (!data.articles || data.articles.length === 0) {
      console.log("No articles found in response");
      cachedArticles = [];
      cacheTimestamp = now;
      
      return NextResponse.json({
        articles: [],
        total: 0,
      });
    }

    // Transform articles to include voting data and fake analysis
    const articles = data.articles.map((article: any, index: number) => ({
      id: `article-${Buffer.from(article.title + article.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}-${index}`,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      source: {
        id: article.source?.id || article.source?.name?.toLowerCase().replace(/\s+/g, "-") || "unknown",
        name: article.source?.name || "Unknown Source",
      },
      author: article.author,
      publishedAt: article.publishedAt,
      content: article.content,
      votes: {
        credible: Math.floor(Math.random() * 100) + 20,
        notCredible: Math.floor(Math.random() * 50) + 5,
        unsure: Math.floor(Math.random() * 30) + 10,
      },
      analysis: generateFakeAnalysis(),
    }));

    console.log("Transformed articles count:", articles.length);

    // Cache the articles
    cachedArticles = articles;
    cacheTimestamp = now;

    return NextResponse.json({
      articles,
      total: articles.length,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    
    // Return cached articles if available, otherwise empty array
    if (cachedArticles) {
      return NextResponse.json({
        articles: cachedArticles,
        total: cachedArticles.length,
      });
    }
    
    // Return empty array as fallback
    cachedArticles = [];
    cacheTimestamp = Date.now();
    
    return NextResponse.json({
      articles: [],
      total: 0,
    });
  }
}

