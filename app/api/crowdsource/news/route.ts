/**
 * API Route: GET /api/crowdsource/news
 * Fetches news articles from NewsAPI
 */

import { NextResponse } from "next/server";
import { getArticleAnalysis } from "@/lib/db/repo";

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
            const articlesPromises = guardianData.response.results.map(async (article: any, index: number) => {
              const articleId = `article-${Buffer.from(article.webTitle + article.webUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}-${index}`;
              
              // Check if analysis exists
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
            
            const articles = await Promise.all(articlesPromises);
            
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

    // Transform articles to include voting data and check for existing analyses
    const articlesPromises = data.articles.map(async (article: any, index: number) => {
      const articleId = `article-${Buffer.from(article.title + article.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}-${index}`;
      
      // Check if analysis exists
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

