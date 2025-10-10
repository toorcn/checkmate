# Checkmate External API - Complete Integration Guide

This comprehensive guide covers all aspects of using the Checkmate External API, including authentication, endpoints, examples, and integration patterns.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [CORS Support](#cors-support)
- [Endpoints Reference](#endpoints-reference)
- [Postman Setup](#postman-setup)
- [Command Line Usage](#command-line-usage)
- [JavaScript/Node.js Integration](#javascriptnodejs-integration)
- [Python Integration](#python-integration)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

## Overview

The Checkmate External API provides programmatic access to:

- **Content Analysis**: TikTok videos, Twitter posts, web articles
- **AI Transcription**: Audio-to-text conversion using OpenAI Whisper
- **Fact-Checking**: Automated verification with credible sources
- **Translation**: Multi-language text translation
- **Crowdsource Voting**: Community-driven credibility assessment
- **Creator Analysis**: Historical credibility tracking

### Base URL

```
Development: http://localhost:3000/api/external
Production: https://checkmate.asia/api/external
```

## Authentication

### API Key Authentication

All endpoints require an API key passed in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key-here" \
     https://checkmate.asia/api/external/transcribe
```

### Available API Keys (Development)

| API Key | Tier | Requests/Hour | Permissions |
|---------|------|---------------|-------------|
| `demo-key-123` | Free | 100 | read, write |
| `test-key-456` | Basic | 1,000 | read |

### Getting Production API Keys

Contact `api-support@checkmate.com` to obtain production API keys with appropriate rate limits.

## Rate Limiting

### Rate Limit Tiers

| Tier | Requests/Hour | Use Case |
|------|---------------|----------|
| Free | 100 | Development, testing |
| Basic | 1,000 | Small applications |
| Premium | 10,000 | Medium applications |
| Enterprise | 100,000 | Large applications |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-10T18:00:00Z
Retry-After: 60
```

### Handling Rate Limits

```javascript
async function makeApiRequest(url, options) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    return null;
  }
  
  return response;
}
```

## CORS Support

### CORS Configuration

- **Allowed Origins**: `*` (all origins)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Content-Type`, `Authorization`, `X-API-Key`, `X-User-ID`

### Preflight Requests

```javascript
// Browser automatically sends preflight for cross-origin requests
fetch('https://api.checkmate.com/external/transcribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({ twitterUrl: 'https://twitter.com/user/status/123' })
});
```

## Endpoints Reference

### 1. API Documentation

**GET** `/api/external`

Returns comprehensive API documentation and status information.

```bash
curl https://checkmate.asia/api/external
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

### 2. Content Transcription & Analysis

**POST** `/api/external/transcribe`

Analyzes and transcribes content from various platforms.

#### Request Body Options

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

#### Response Format

```json
{
  "success": true,
  "data": {
    "transcription": {
      "text": "Transcribed text content...",
      "segments": [],
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

#### Request Body

```json
{
  "text": "Hello world",
  "targetLanguage": "ms",
  "sourceLanguage": "auto"
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "translatedText": "Halo dunia",
    "sourceLanguage": "en",
    "targetLanguage": "ms",
    "confidence": 0.95
  }
}
```

**GET** `/api/external/translate`

Returns supported languages and API information.

### 4. Content Analyses Management

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

#### Request Body

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

#### Request Body

```json
{
  "articleId": "article123",
  "voteType": "credible"
}
```

**Vote Types:**
- `"credible"` - Content is trustworthy
- `"notCredible"` - Content is unreliable
- `"unsure"` - Cannot determine credibility

#### Response Format

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

## Postman Setup

### 1. Create New Collection

1. Open Postman
2. Click "New" → "Collection"
3. Name it "Checkmate External API"

### 2. Set Collection Variables

Go to the collection settings and add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000/api/external` | `https://checkmate.asia/api/external` |
| `checkmateApiKey` | `demo-key-123` | `demo-key-123` |

### 3. Create Environment (Optional)

Create an environment for different configurations:

**Development Environment:**
```json
{
  "baseUrl": "http://localhost:3000/api/external",
  "checkmateApiKey": "demo-key-123"
}
```

**Production Environment:**
```json
{
  "baseUrl": "https://checkmate.asia/api/external",
  "checkmateApiKey": "your-production-api-key"
}
```

### 4. Sample Requests

#### API Documentation

- **Method**: `GET`
- **URL**: `{{baseUrl}}`
- **Headers**: None required

#### Analyze TikTok Video

- **Method**: `POST`
- **URL**: `{{baseUrl}}/transcribe`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{checkmateApiKey}}
  ```
- **Body** (raw JSON):
  ```json
  {
    "tiktokUrl": "https://tiktok.com/@username/video/1234567890"
  }
  ```

#### Translate Text

- **Method**: `POST`
- **URL**: `{{baseUrl}}/translate`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{checkmateApiKey}}
  ```
- **Body** (raw JSON):
  ```json
  {
    "text": "Hello world",
    "targetLanguage": "ms",
    "sourceLanguage": "auto"
  }
  ```

#### Submit Vote

- **Method**: `POST`
- **URL**: `{{baseUrl}}/crowdsource/vote`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{checkmateApiKey}}
  ```
- **Body** (raw JSON):
  ```json
  {
    "articleId": "article123",
    "voteType": "credible"
  }
  ```

### 5. Pre-request Scripts

Add this pre-request script to automatically handle authentication:

```javascript
// Set API key if not already set
if (!pm.request.headers.has('X-API-Key')) {
    pm.request.headers.add({
        key: 'X-API-Key',
        value: pm.environment.get('checkmateApiKey') || pm.collectionVariables.get('checkmateApiKey')
    });
}
```

### 6. Tests Scripts

Add this test script to validate responses:

```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test for valid JSON
pm.test("Response is valid JSON", function () {
    pm.response.to.be.json;
});

// Test for success field (if applicable)
if (pm.response.json().success !== undefined) {
    pm.test("Success field is true", function () {
        pm.expect(pm.response.json().success).to.be.true;
    });
}

// Log response for debugging
console.log("Response:", pm.response.json());
```

## Command Line Usage

### Using cURL

#### Basic Analysis Request

```bash
curl -X POST http://localhost:3000/api/external/transcribe \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-123" \
  -d '{"twitterUrl": "https://twitter.com/username/status/1234567890"}'
```

#### Translation Request

```bash
curl -X POST http://localhost:3000/api/external/translate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-123" \
  -d '{"text": "Hello world", "targetLanguage": "ms"}'
```

#### Get Analyses

```bash
curl -H "X-API-Key: demo-key-123" \
     http://localhost:3000/api/external/analyses
```

#### Submit Vote

```bash
curl -X POST http://localhost:3000/api/external/crowdsource/vote \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-123" \
  -d '{"articleId": "article123", "voteType": "credible"}'
```

### Using HTTPie

#### Install HTTPie

```bash
# macOS
brew install httpie

# Ubuntu/Debian
sudo apt install httpie

# Windows
pip install httpie
```

#### Basic Usage

```bash
# Analyze content
http POST localhost:3000/api/external/transcribe \
  X-API-Key:demo-key-123 \
  twitterUrl="https://twitter.com/username/status/1234567890"

# Translate text
http POST localhost:3000/api/external/translate \
  X-API-Key:demo-key-123 \
  text="Hello world" \
  targetLanguage=ms

# Get analyses
http GET localhost:3000/api/external/analyses \
  X-API-Key:demo-key-123
```

### Using wget

```bash
# Get API documentation
wget --header="X-API-Key: demo-key-123" \
     -O response.json \
     http://localhost:3000/api/external

# POST request with wget
wget --post-data='{"text":"Hello world","targetLanguage":"ms"}' \
     --header="Content-Type: application/json" \
     --header="X-API-Key: demo-key-123" \
     -O response.json \
     http://localhost:3000/api/external/translate
```

## JavaScript/Node.js Integration

### Basic Setup

```javascript
const API_BASE_URL = 'https://checkmate.asia/api/external';
const API_KEY = 'demo-key-123';

class CheckmateAPI {
  constructor(apiKey, baseUrl = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Analyze content
  async analyzeContent(url, platform = 'auto') {
    const body = {};
    
    if (platform === 'tiktok' || url.includes('tiktok.com')) {
      body.tiktokUrl = url;
    } else if (platform === 'twitter' || url.includes('twitter.com') || url.includes('x.com')) {
      body.twitterUrl = url;
    } else if (platform === 'web') {
      body.webUrl = url;
    } else {
      body.videoUrl = url;
    }

    return await this.makeRequest('/transcribe', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Translate text
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    return await this.makeRequest('/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage
      })
    });
  }

  // Get analyses
  async getAnalyses() {
    return await this.makeRequest('/analyses');
  }

  // Submit vote
  async submitVote(articleId, voteType) {
    return await this.makeRequest('/crowdsource/vote', {
      method: 'POST',
      body: JSON.stringify({
        articleId,
        voteType
      })
    });
  }

  // Get vote counts
  async getVoteCounts(articleId) {
    return await this.makeRequest(`/crowdsource/vote?articleId=${articleId}`);
  }
}

// Usage
const api = new CheckmateAPI('demo-key-123');

// Analyze a TikTok video
const analysis = await api.analyzeContent('https://tiktok.com/@user/video/123');
console.log('Transcription:', analysis.data.transcription.text);

// Translate text
const translation = await api.translateText('Hello world', 'ms');
console.log('Translation:', translation.data.translatedText);
```

### Advanced Usage with Error Handling

```javascript
class CheckmateAPIClient {
  constructor(apiKey, baseUrl = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async makeRequestWithRetry(endpoint, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.makeRequest(endpoint, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('4')) {
          throw error;
        }
        
        if (attempt < this.retryAttempts) {
          console.log(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await this.sleep(this.retryDelay);
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers
        },
        ...options
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error || ''}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to API');
      }
      throw error;
    }
  }

  // Batch analysis
  async analyzeMultipleContents(urls) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.makeRequestWithRetry('/transcribe', {
          method: 'POST',
          body: JSON.stringify({ videoUrl: url })
        });
        results.push({ url, success: true, data: result });
      } catch (error) {
        results.push({ url, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Stream analysis (for long-running operations)
  async analyzeContentStream(url, onProgress) {
    const analysis = await this.makeRequestWithRetry('/transcribe', {
      method: 'POST',
      body: JSON.stringify({ videoUrl: url })
    });

    if (onProgress) {
      onProgress({ stage: 'transcription', data: analysis.data.transcription });
      onProgress({ stage: 'fact-checking', data: analysis.data.factCheck });
      onProgress({ stage: 'complete', data: analysis.data });
    }

    return analysis;
  }
}

// Usage with error handling
const client = new CheckmateAPIClient('demo-key-123');

try {
  const analysis = await client.analyzeContentStream(
    'https://tiktok.com/@user/video/123',
    (progress) => {
      console.log(`Progress: ${progress.stage}`, progress.data);
    }
  );
  console.log('Analysis complete:', analysis);
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

## Python Integration

### Basic Setup

```python
import requests
import json
from typing import Dict, Any, Optional

class CheckmateAPI:
    def __init__(self, api_key: str, base_url: str = "https://checkmate.asia/api/external"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        })

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                retry_after = e.response.headers.get('Retry-After', '60')
                raise Exception(f"Rate limited. Retry after {retry_after} seconds")
            raise Exception(f"API request failed: {e.response.status_code} {e.response.text}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

    def analyze_content(self, url: str, platform: str = 'auto') -> Dict[str, Any]:
        """Analyze content from various platforms"""
        body = {}
        
        if platform == 'tiktok' or 'tiktok.com' in url:
            body['tiktokUrl'] = url
        elif platform == 'twitter' or 'twitter.com' in url or 'x.com' in url:
            body['twitterUrl'] = url
        elif platform == 'web':
            body['webUrl'] = url
        else:
            body['videoUrl'] = url

        return self._make_request('POST', '/transcribe', json=body)

    def translate_text(self, text: str, target_language: str, source_language: str = 'auto') -> Dict[str, Any]:
        """Translate text between languages"""
        body = {
            'text': text,
            'targetLanguage': target_language,
            'sourceLanguage': source_language
        }
        return self._make_request('POST', '/translate', json=body)

    def get_analyses(self) -> Dict[str, Any]:
        """Get user analyses"""
        return self._make_request('GET', '/analyses')

    def submit_vote(self, article_id: str, vote_type: str) -> Dict[str, Any]:
        """Submit credibility vote"""
        body = {
            'articleId': article_id,
            'voteType': vote_type
        }
        return self._make_request('POST', '/crowdsource/vote', json=body)

    def get_vote_counts(self, article_id: str) -> Dict[str, Any]:
        """Get vote counts for an article"""
        return self._make_request('GET', f'/crowdsource/vote?articleId={article_id}')

# Usage
api = CheckmateAPI('demo-key-123')

# Analyze content
analysis = api.analyze_content('https://tiktok.com/@user/video/123')
print(f"Transcription: {analysis['data']['transcription']['text']}")

# Translate text
translation = api.translate_text('Hello world', 'ms')
print(f"Translation: {translation['data']['translatedText']}")
```

### Advanced Python Client

```python
import requests
import json
import time
from typing import Dict, Any, List, Callable, Optional
from dataclasses import dataclass
from enum import Enum

class VoteType(Enum):
    CREDIBLE = "credible"
    NOT_CREDIBLE = "notCredible"
    UNSURE = "unsure"

@dataclass
class AnalysisResult:
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None

class CheckmateAPIClient:
    def __init__(self, api_key: str, base_url: str = "https://checkmate.asia/api/external"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        })
        self.retry_attempts = 3
        self.retry_delay = 1.0

    def _make_request_with_retry(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make request with automatic retry logic"""
        last_error = None
        
        for attempt in range(1, self.retry_attempts + 1):
            try:
                return self._make_request(method, endpoint, **kwargs)
            except Exception as e:
                last_error = e
                
                # Don't retry on authentication errors
                if '401' in str(e) or '403' in str(e):
                    raise e
                
                # Don't retry on client errors
                if '4' in str(e) and not '429' in str(e):
                    raise e
                
                if attempt < self.retry_attempts:
                    print(f"Attempt {attempt} failed, retrying in {self.retry_delay}s...")
                    time.sleep(self.retry_delay)
                    self.retry_delay *= 2  # Exponential backoff
        
        raise last_error

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            
            # Handle rate limiting
            if response.status_code == 429:
                retry_after = response.headers.get('Retry-After', '60')
                raise Exception(f"Rate limited. Retry after {retry_after} seconds")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', str(e))
            except:
                error_msg = str(e)
            raise Exception(f"API request failed: {e.response.status_code} {error_msg}")
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

    def analyze_content(self, url: str, platform: str = 'auto') -> AnalysisResult:
        """Analyze content with error handling"""
        try:
            body = self._build_analysis_body(url, platform)
            result = self._make_request_with_retry('POST', '/transcribe', json=body)
            return AnalysisResult(success=True, data=result)
        except Exception as e:
            return AnalysisResult(success=False, data={}, error=str(e))

    def _build_analysis_body(self, url: str, platform: str) -> Dict[str, str]:
        """Build request body for content analysis"""
        if platform == 'tiktok' or 'tiktok.com' in url:
            return {'tiktokUrl': url}
        elif platform == 'twitter' or 'twitter.com' in url or 'x.com' in url:
            return {'twitterUrl': url}
        elif platform == 'web':
            return {'webUrl': url}
        else:
            return {'videoUrl': url}

    def translate_text(self, text: str, target_language: str, source_language: str = 'auto') -> AnalysisResult:
        """Translate text with error handling"""
        try:
            body = {
                'text': text,
                'targetLanguage': target_language,
                'sourceLanguage': source_language
            }
            result = self._make_request_with_retry('POST', '/translate', json=body)
            return AnalysisResult(success=True, data=result)
        except Exception as e:
            return AnalysisResult(success=False, data={}, error=str(e))

    def batch_analyze(self, urls: List[str], platform: str = 'auto') -> List[AnalysisResult]:
        """Analyze multiple URLs in batch"""
        results = []
        
        for url in urls:
            result = self.analyze_content(url, platform)
            results.append(result)
            
            # Small delay between requests to avoid rate limiting
            time.sleep(0.1)
        
        return results

    def analyze_with_progress(self, url: str, platform: str = 'auto', 
                            on_progress: Optional[Callable] = None) -> AnalysisResult:
        """Analyze content with progress callback"""
        try:
            body = self._build_analysis_body(url, platform)
            result = self._make_request_with_retry('POST', '/transcribe', json=body)
            
            if on_progress:
                on_progress({'stage': 'transcription', 'data': result['data']['transcription']})
                on_progress({'stage': 'fact-checking', 'data': result['data']['factCheck']})
                on_progress({'stage': 'complete', 'data': result['data']})
            
            return AnalysisResult(success=True, data=result)
        except Exception as e:
            return AnalysisResult(success=False, data={}, error=str(e))

    def submit_vote(self, article_id: str, vote_type: VoteType) -> AnalysisResult:
        """Submit credibility vote"""
        try:
            body = {
                'articleId': article_id,
                'voteType': vote_type.value
            }
            result = self._make_request_with_retry('POST', '/crowdsource/vote', json=body)
            return AnalysisResult(success=True, data=result)
        except Exception as e:
            return AnalysisResult(success=False, data={}, error=str(e))

    def get_vote_counts(self, article_id: str) -> AnalysisResult:
        """Get vote counts for an article"""
        try:
            result = self._make_request_with_retry('GET', f'/crowdsource/vote?articleId={article_id}')
            return AnalysisResult(success=True, data=result)
        except Exception as e:
            return AnalysisResult(success=False, data={}, error=str(e))

# Usage example
def progress_callback(progress):
    print(f"Progress: {progress['stage']} - {progress['data']}")

api = CheckmateAPIClient('demo-key-123')

# Single analysis
result = api.analyze_content('https://tiktok.com/@user/video/123')
if result.success:
    print(f"Transcription: {result.data['data']['transcription']['text']}")
else:
    print(f"Error: {result.error}")

# Batch analysis
urls = [
    'https://tiktok.com/@user1/video/123',
    'https://tiktok.com/@user2/video/456',
    'https://twitter.com/user/status/789'
]

results = api.batch_analyze(urls)
for i, result in enumerate(results):
    if result.success:
        print(f"URL {i+1}: Success")
    else:
        print(f"URL {i+1}: Error - {result.error}")

# Analysis with progress
result = api.analyze_with_progress(
    'https://tiktok.com/@user/video/123',
    on_progress=progress_callback
)
```

## Error Handling

### Common Error Codes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key | Check API key in headers |
| `FORBIDDEN` | 403 | Insufficient permissions | Upgrade API key tier |
| `RATE_LIMITED` | 429 | Rate limit exceeded | Wait and retry |
| `VALIDATION_ERROR` | 400 | Invalid request format | Check request body |
| `INTERNAL_ERROR` | 500 | Server error | Contact support |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Handling Errors in Code

```javascript
async function handleApiError(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        throw new Error('Invalid API key');
      case 403:
        throw new Error('Insufficient permissions');
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      case 400:
        throw new Error(`Validation error: ${errorData.error}`);
      case 500:
        throw new Error('Internal server error');
      default:
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  }
}
```

## Testing

### Using the Test Script

```bash
# Run all tests
npm run test:api

# Test with custom environment
API_BASE_URL=http://localhost:3000 CHECKMATE_API_KEY=demo-key-123 npm run test:api
```

### Manual Testing

```bash
# Test API documentation
curl http://localhost:3000/api/external

# Test authentication
curl -H "X-API-Key: demo-key-123" http://localhost:3000/api/external/transcribe

# Test content analysis
curl -X POST http://localhost:3000/api/external/transcribe \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-123" \
  -d '{"twitterUrl": "https://twitter.com/user/status/123"}'

# Test translation
curl -X POST http://localhost:3000/api/external/translate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-123" \
  -d '{"text": "Hello world", "targetLanguage": "ms"}'
```

### Unit Testing

```javascript
// test/api.test.js
const { testExternalAPI } = require('../test-external-api');

describe('External API', () => {
  test('should return API documentation', async () => {
    const result = await testExternalAPI();
    expect(result).toBeDefined();
  });
});
```

## Production Deployment

### Environment Variables

```bash
# Production environment
API_BASE_URL=https://checkmate.asia/api/external
CHECKMATE_API_KEY=your-production-api-key
```

### Security Considerations

1. **API Key Management**
   - Store API keys securely (environment variables, secrets manager)
   - Rotate keys regularly
   - Use different keys for different environments

2. **Rate Limiting**
   - Implement client-side rate limiting
   - Use exponential backoff for retries
   - Monitor usage against limits

3. **Error Handling**
   - Implement comprehensive error handling
   - Log errors for debugging
   - Provide fallback mechanisms

4. **Monitoring**
   - Monitor API response times
   - Track error rates
   - Set up alerts for failures

### Performance Optimization

1. **Caching**
   - Cache API responses when appropriate
   - Use ETags for conditional requests
   - Implement client-side caching

2. **Batch Operations**
   - Use batch endpoints when available
   - Combine multiple requests
   - Implement request queuing

3. **Connection Pooling**
   - Reuse HTTP connections
   - Implement connection pooling
   - Use keep-alive connections

### Deployment Checklist

- [ ] API keys configured for production
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup and recovery tested

## Support

### Getting Help

- **Documentation**: `/api/external` endpoint
- **Status**: Check response headers for service status
- **Contact**: api-support@checkmate.com
- **Issues**: GitHub Issues for bug reports

### Community

- **Discord**: Join our developer community
- **GitHub**: Contribute to the project
- **Blog**: Read our technical blog posts
- **Newsletter**: Subscribe for updates

---

_For more information, visit our [main documentation](README.md) or [API reference](EXTERNAL_API.md)._
