# Crowdsource News Verification

This module provides a community-driven news verification system where users can vote on the credibility of news articles.

## Features

- **Real News Integration**: Fetches real news articles from GNews API (free tier available)
- **Community Voting**: Users can vote articles as Credible, Not Credible, or Unsure
- **AI Analysis**: Each article includes fake/mock AI-generated analysis for demonstration
- **Vote Tracking**: Real-time vote counts and statistics
- **Responsive Design**: Works seamlessly on mobile and desktop

## Components

### CrowdsourcePageContent
Main client component that wraps the crowdsource page content.

### CrowdsourceLayout
Layout component organizing the main feed and sidebar.

### NewsArticlesList
Fetches and displays news articles with voting capability.

### NewsArticleCard
Individual article card with:
- Article thumbnail and metadata
- Voting buttons (Credible/Unsure/Not Credible)
- Expandable AI analysis section
- Link to original article

### VotingStats
Sidebar component showing community statistics and voting guidelines.

## API Routes

### GET /api/crowdsource/news
Fetches news articles from GNews API with:
- Fake analysis data (verdict, confidence, summary, key points)
- Initial vote counts
- Falls back to mock data if API fails or is not configured

### POST /api/crowdsource/vote
Handles user votes with body:
```json
{
  "articleId": "article-id",
  "voteType": "credible" | "notCredible" | "unsure"
}
```

### GET /api/crowdsource/vote?articleId=xxx
Retrieves current vote counts for an article.

## Setup

1. **Get a GNews API Key** (optional, falls back to mock data):
   - Sign up at https://gnews.io
   - Get your free API key (100 requests/day on free tier)
   
2. **Add to .env.local**:
   ```
   GNEWS_API_KEY=your-api-key-here
   ```

3. **Without API Key**: 
   The page will work with mock data automatically if no API key is configured.

## Usage

Navigate to `/crowdsource` to access the community news verification page.

Users can:
1. Browse real news articles
2. Vote on article credibility
3. View AI analysis (fake data for demo)
4. See community voting statistics
5. Click through to read full articles

## Future Enhancements

- [ ] User authentication for vote tracking
- [ ] Prevent duplicate votes from same user
- [ ] Real AI analysis integration
- [ ] Database persistence for votes
- [ ] Article filtering and search
- [ ] Leaderboard for top contributors
- [ ] Report inappropriate content
- [ ] Share articles on social media

## Branding & Design

The crowdsource page follows Checkmate's design system:
- Consistent color scheme (primary: pink/red tones)
- Tailwind CSS utilities
- Responsive card layouts
- Shadcn/ui components
- Lucide React icons
- Dark/light theme support
- Multi-language support (EN/MS/ZH)

## Notes

- Vote storage is currently in-memory (resets on server restart)
- Analysis data is randomly generated for demonstration
- Free GNews API has rate limits (100 requests/day)
- Images from articles may not always load (depends on source)
