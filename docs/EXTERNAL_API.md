# External API Documentation

This document describes how to use the Checkmate External API for content analysis, transcription, and fact-checking services.

## Overview

The External API provides programmatic access to Checkmate's core features through REST endpoints with API key authentication, rate limiting, and CORS support.

## Base URL

```
https://your-domain.com/api/external
```

## Authentication

All endpoints require an API key passed in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key-here" \
     https://your-domain.com/api/external/transcribe
```

## Rate Limiting

Rate limits are based on your API key tier:

- **Free**: 100 requests per hour
- **Basic**: 1,000 requests per hour
- **Premium**: 10,000 requests per hour
- **Enterprise**: 100,000 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (ISO timestamp)
- `Retry-After`: Seconds to wait before retrying

## CORS Support

All endpoints support CORS for cross-origin requests:

- **Allowed Origins**: `*`
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Content-Type`, `Authorization`, `X-API-Key`, `X-User-ID`

## Endpoints

### 1. API Documentation

**GET** `/api/external`

Returns comprehensive API documentation and status information.

```bash
curl https://your-domain.com/api/external
```

**Response:**
```json
{
  "name": "Checkmate External API",
  "version": "1.0.0",
  "description": "External API for content analysis...",
  "endpoints": [...],
  "authentication": {...},
  "rateLimiting": {...}
}
```

### 2. Content Transcription

**POST** `/api/external/transcribe`

Analyzes and transcribes content from various platforms.

**Request:**
```json
{
  "tiktokUrl": "https://tiktok.com/@user/video/123...",
  // OR
  "twitterUrl": "https://twitter.com/user/status/123...",
  // OR
  "webUrl": "https://example.com/article",
  // OR
  "videoUrl": "https://any-video-url.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": {
      "text": "Transcribed text content...",
      "segments": [...],
      "language": "en"
    },
    "metadata": {
      "title": "Content title",
      "creator": "Creator name",
      "platform": "tiktok"
    },
    "factCheck": {
      "verdict": "verified",
      "confidence": 85,
      "explanation": "Fact-check explanation..."
    },
    "requiresFactCheck": true,
    "creatorCredibilityRating": 7.5
  }
}
```

**GET** `/api/external/transcribe`

Returns service health and supported platforms.

### 3. Text Translation

**POST** `/api/external/translate`

Translates text between supported languages.

**Request:**
```json
{
  "text": "Hello world",
  "targetLanguage": "es",
  "sourceLanguage": "auto"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translatedText": "Hola mundo",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "confidence": 0.95
  }
}
```

**GET** `/api/external/translate`

Returns supported languages and API information.

### 4. Content Analyses

**GET** `/api/external/analyses`

Retrieves analyses for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "analysis123",
      "userId": "user123",
      "videoUrl": "https://example.com/video.mp4",
      "transcription": {...},
      "metadata": {...},
      "factCheck": {...},
      "requiresFactCheck": true,
      "creatorCredibilityRating": 7.5,
      "createdAt": 1640995200000,
      "updatedAt": 1640995200000
    }
  ]
}
```

**POST** `/api/external/analyses`

Creates a new analysis.

**Request:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "transcription": { "text": "..." },
  "metadata": { "title": "...", "platform": "..." },
  "factCheck": { "verdict": "verified", "confidence": 85 },
  "requiresFactCheck": true,
  "creatorCredibilityRating": 7.5,
  "contentCreatorId": "creator123",
  "platform": "tiktok"
}
```

### 5. Crowdsource Voting

**POST** `/api/external/crowdsource/vote`

Submits a vote on content credibility.

**Request:**
```json
{
  "articleId": "article123",
  "voteType": "credible"
}
```

**Response:**
```json
{
  "success": true,
  "votes": {
    "credible": 15,
    "notCredible": 3,
    "unsure": 2
  }
}
```

**GET** `/api/external/crowdsource/vote?articleId=article123`

Retrieves vote counts for an article.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Valid API key required
- `FORBIDDEN` (403): Insufficient permissions
- `RATE_LIMITED` (429): Rate limit exceeded
- `VALIDATION_ERROR` (400): Invalid request format
- `INTERNAL_ERROR` (500): Internal server error

## SDK Examples

### JavaScript/Node.js

```javascript
const API_KEY = 'your-api-key-here';
const BASE_URL = 'https://your-domain.com/api/external';

async function transcribeContent(url) {
  const response = await fetch(`${BASE_URL}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ videoUrl: url })
  });
  
  return await response.json();
}

// Usage
const result = await transcribeContent('https://tiktok.com/@user/video/123');
console.log(result.data.transcription.text);
```

### Python

```python
import requests

API_KEY = 'your-api-key-here'
BASE_URL = 'https://your-domain.com/api/external'

def transcribe_content(url):
    response = requests.post(
        f'{BASE_URL}/transcribe',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        json={'videoUrl': url}
    )
    return response.json()

# Usage
result = transcribe_content('https://tiktok.com/@user/video/123')
print(result['data']['transcription']['text'])
```

### cURL

```bash
# Transcribe content
curl -X POST https://your-domain.com/api/external/transcribe \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"videoUrl": "https://tiktok.com/@user/video/123"}'

# Translate text
curl -X POST https://your-domain.com/api/external/translate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"text": "Hello world", "targetLanguage": "es"}'

# Get analyses
curl -H "X-API-Key: your-api-key-here" \
     https://your-domain.com/api/external/analyses
```

## Testing

Use the provided test script to verify API functionality:

```bash
# Set environment variables
export API_BASE_URL="https://your-domain.com"
export API_KEY="your-api-key-here"

# Run tests
node test-external-api.js
```

## Support

- **Documentation**: `/api/external`
- **Status**: Check response headers for service status
- **Contact**: api-support@checkmate.com

## Changelog

### v1.0.0
- Initial release
- Content transcription and analysis
- Text translation
- Crowdsource voting
- API key authentication
- Rate limiting
- CORS support
