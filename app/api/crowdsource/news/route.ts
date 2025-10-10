/**
 * API Route: GET /api/crowdsource/news
 * Fetches news articles (defaults to The Guardian, falls back to NewsAPI)
 */

import { NextResponse } from "next/server";
import { getArticleAnalysis } from "@/lib/db/repo";

// Guardian API (free, generous limits for keyless test; use key if available)
const GUARDIAN_API_URL = "https://content.guardianapis.com/search";

// NewsAPI (free tier: 1000 requests/day)
const NEWS_API_KEY = process.env.NEWS_API_KEY || "your-newsapi-key-here";
const NEWS_API_URL = "https://newsapi.org/v2/top-headlines";

// Cache for articles to maintain stable IDs
let cachedArticles: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    // Default to Guardian API first
    try {
      const guardianUrl = `${GUARDIAN_API_URL}?api-key=${process.env.GUARDIAN_API_KEY || 'test'}&page-size=10&show-fields=thumbnail,trailText`;
      console.log("Fetching Guardian API:", guardianUrl.replace(process.env.GUARDIAN_API_KEY || 'test', '***'));

      const guardianResponse = await fetch(guardianUrl, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      console.log("Guardian API response status:", guardianResponse.status);

      if (guardianResponse.ok) {
        const guardianData = await guardianResponse.json();
        if (guardianData.response && guardianData.response.results) {
          const guardianArticlesPromises = guardianData.response.results.map(async (article: any, index: number) => {
            const articleId = `article-${Buffer.from(article.webTitle + article.webUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}-${index}`;

            const existingAnalysis = await getArticleAnalysis(articleId);

            return {
              id: articleId,
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
              hasAnalysis: !!existingAnalysis,
              analysis: existingAnalysis ? {
                verdict: existingAnalysis.verdict,
                confidence: existingAnalysis.confidence,
                summary: existingAnalysis.summary,
                keyPoints: JSON.parse(existingAnalysis.keyPoints as string),
              } : null,
            };
          });

          const guardianArticles = await Promise.all(guardianArticlesPromises);

          // Cache the articles
          cachedArticles = guardianArticles;
          cacheTimestamp = now;

          return NextResponse.json({
            articles: guardianArticles,
            total: guardianArticles.length,
          });
        }
      }
    } catch (guardianError) {
      console.log("Guardian API failed:", guardianError);
    }

    // Fallback to NewsAPI if Guardian fails or returns no results
    try {
      // Get your free API key at: https://newsapi.org/register
      const newsApiUrl = `${NEWS_API_URL}?apiKey=${NEWS_API_KEY}&country=us&pageSize=10`;
      console.log("Fetching NewsAPI:", newsApiUrl.replace(NEWS_API_KEY, "***"));

      const response = await fetch(newsApiUrl, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      console.log("NewsAPI response status:", response.status);

      if (!response.ok) {
        throw new Error(`NewsAPI request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.articles || data.articles.length === 0) {
        cachedArticles = [];
        cacheTimestamp = now;
        return NextResponse.json({
          articles: [],
          total: 0,
        });
      }

      const articlesPromises = data.articles.map(async (article: any, index: number) => {
        const articleId = `article-${Buffer.from(article.title + article.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}-${index}`;

        const existingAnalysis = await getArticleAnalysis(articleId);

        return {
          id: articleId,
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
          hasAnalysis: !!existingAnalysis,
          analysis: existingAnalysis ? {
            verdict: existingAnalysis.verdict,
            confidence: existingAnalysis.confidence,
            summary: existingAnalysis.summary,
            keyPoints: JSON.parse(existingAnalysis.keyPoints as string),
          } : null,
        };
      });

      const articles = await Promise.all(articlesPromises);

      // Cache the articles
      cachedArticles = articles;
      cacheTimestamp = now;

      return NextResponse.json({
        articles,
        total: articles.length,
      });
    } catch (newsApiError) {
      console.log("NewsAPI also failed:", newsApiError);
    }

    // If both providers fail, return empty array
    cachedArticles = [];
    cacheTimestamp = now;
    return NextResponse.json({
      articles: [],
      total: 0,
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

