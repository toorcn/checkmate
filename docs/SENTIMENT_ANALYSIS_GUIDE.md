# AWS Comprehend Sentiment Analysis Integration Guide

## Overview

This guide explains how AWS Comprehend sentiment analysis has been integrated into the Checkmate fake news detection system to enhance content analysis and misinformation detection.

## What is Sentiment Analysis?

Sentiment analysis uses AWS Comprehend's natural language processing (NLP) capabilities to:
- Detect overall sentiment (positive, negative, neutral, mixed)
- Provide confidence scores for each sentiment category
- Extract key phrases from the content
- Identify entities and their types
- Calculate emotional intensity
- Flag potentially manipulative or inflammatory content

## Why Sentiment Analysis for Fake News Detection?

Research shows that misinformation often exhibits distinct emotional characteristics:

1. **High Emotional Intensity**: Fake news tends to be more emotionally charged to manipulate readers
2. **Inflammatory Language**: Uses provocative words and phrases designed to trigger emotional responses
3. **Fear-mongering**: Heavy use of negative sentiment to create panic or anger
4. **Clickbait**: Suspiciously high positive sentiment ("too good to be true")
5. **Emotional Manipulation**: Mixed sentiment with high intensity often indicates manipulation

## Implementation

### Architecture

```
Content → Transcription → Sentiment Analysis (AWS Comprehend) → Fact-Check Result
```

### Files Modified

1. **`lib/aws.ts`** - Added AWS Comprehend client
2. **`lib/sentiment-analysis.ts`** - Core sentiment analysis logic (NEW)
3. **`app/api/transcribe/handlers/base-handler.ts`** - Updated `FactCheckResult` interface
4. **`app/api/transcribe/handlers/tiktok-handler.ts`** - Integrated sentiment analysis
5. **`app/api/transcribe/handlers/twitter-handler.ts`** - Integrated sentiment analysis
6. **`app/api/transcribe/handlers/web-handler.ts`** - Integrated sentiment analysis

### Data Structure

The `FactCheckResult` interface now includes:

```typescript
sentimentAnalysis?: {
  overall: string; // POSITIVE, NEGATIVE, NEUTRAL, MIXED
  scores: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  keyPhrases: string[];
  entities?: Array<{
    text: string;
    type: string;
  }>;
  emotionalIntensity: number; // 0-1 scale
  flags: string[]; // Warning flags
};
```

### Sentiment Flags

The system automatically detects and flags:

- **`high_negative_sentiment`** - Very high negative sentiment (>70%), potential fear-mongering
- **`emotionally_manipulative`** - High emotional intensity with mixed sentiment
- **`inflammatory_language`** - Contains inflammatory keywords (shocking, scandal, exposed, etc.)
- **`suspiciously_positive`** - Very high positive sentiment (>85%), potential clickbait

## Usage

### In Code

Sentiment analysis is automatically performed during fact-checking:

```typescript
const sentimentAnalysis = await analyzeSentiment(
  textToFactCheck,
  languageCode,  // e.g., "en", "es", "fr"
  requestId
);
```

### Environment Setup

Ensure AWS credentials are configured:

```env
APP_REGION=us-east-1  # Or your preferred AWS region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Supported Languages

AWS Comprehend supports:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Arabic (ar)
- Hindi (hi)
- Japanese (ja)
- Korean (ko)
- Chinese Simplified (zh)
- Chinese Traditional (zh-TW)

Unsupported languages automatically fall back to English.

## Impact on Credibility Scoring

Sentiment analysis results influence the final credibility rating:

### Credibility Modifiers

The `calculateSentimentCredibilityModifier()` function applies penalties:

- **High emotional intensity (>0.8)**: -10% credibility
- **Inflammatory language**: -10% credibility
- **Emotionally manipulative**: -15% credibility
- **Suspiciously positive**: -5% credibility

Example:
```typescript
const modifier = calculateSentimentCredibilityModifier(sentiment);
const adjustedCredibility = baseCredibility * modifier;
// If base = 80%, and modifier = 0.85, adjusted = 68%
```

## Interpreting Results

### Emotional Intensity Scale

| Value | Interpretation |
|-------|---------------|
| 0.0 - 0.3 | Low emotional content (neutral, factual) |
| 0.3 - 0.6 | Moderate emotional content |
| 0.6 - 0.8 | High emotional content (potentially biased) |
| 0.8 - 1.0 | Very high emotional content (red flag) |

### Flag Combinations

| Flags | Likely Indication |
|-------|------------------|
| `high_negative_sentiment` | Fear-mongering, anger provocation |
| `inflammatory_language` | Clickbait, sensationalism |
| `emotionally_manipulative` | Deliberate manipulation attempt |
| `suspiciously_positive` | Too good to be true, scam, clickbait |

## API Response Example

```json
{
  "factCheck": {
    "verdict": "misleading",
    "confidence": 65,
    "sentimentAnalysis": {
      "overall": "NEGATIVE",
      "scores": {
        "positive": 0.05,
        "negative": 0.82,
        "neutral": 0.08,
        "mixed": 0.05
      },
      "keyPhrases": [
        "shocking revelation",
        "mainstream media won't tell you",
        "wake up sheeple"
      ],
      "entities": [
        { "text": "government", "type": "ORGANIZATION" },
        { "text": "conspiracy", "type": "EVENT" }
      ],
      "emotionalIntensity": 0.87,
      "flags": [
        "high_negative_sentiment",
        "inflammatory_language"
      ]
    }
  }
}
```

## Best Practices

### For Developers

1. **Always handle null cases**: Sentiment analysis may fail or be unavailable
2. **Use flags as signals, not absolutes**: High emotion doesn't always mean misinformation
3. **Combine with other signals**: Sentiment is one factor among many (sources, political bias, etc.)
4. **Monitor AWS Comprehend costs**: Each API call has a cost (see AWS pricing)

### For Analysts

1. **Context matters**: Emotional content isn't always misleading (e.g., personal stories, opinion pieces)
2. **Look for patterns**: Multiple red flags together are more concerning than single flags
3. **Cultural differences**: Different languages/cultures have different emotional baselines
4. **Verify independently**: Use sentiment as a starting point for deeper investigation

## Troubleshooting

### Common Issues

**Issue**: Sentiment analysis returns null
- **Cause**: Text too short, empty content, or API error
- **Solution**: Check content length and AWS credentials

**Issue**: Language detection incorrect
- **Cause**: Auto-detection failed or mixed-language content
- **Solution**: Explicitly pass correct language code

**Issue**: High AWS costs
- **Cause**: Too many API calls
- **Solution**: Implement caching, batch processing, or rate limiting

## Performance Considerations

- **API Latency**: ~200-500ms per request
- **Text Limits**: 5000 bytes per request (content is auto-truncated)
- **Batch Processing**: Consider batching for large-scale analysis
- **Caching**: Cache results for identical content to reduce costs

## Future Enhancements

Potential improvements:

1. **Sentiment trending**: Track sentiment changes over time for evolving stories
2. **Entity-level sentiment**: Analyze sentiment toward specific people/organizations
3. **Syntax analysis**: Add AWS Comprehend syntax parsing for deeper linguistic analysis
4. **Custom models**: Train custom sentiment models for misinformation-specific patterns
5. **Multi-modal analysis**: Combine text sentiment with image/video analysis

## Resources

- [AWS Comprehend Documentation](https://docs.aws.amazon.com/comprehend/)
- [Sentiment Analysis Best Practices](https://aws.amazon.com/blogs/machine-learning/)
- [Research: Emotion and Fake News](https://www.science.org/doi/10.1126/science.aap9559)

## Support

For questions or issues:
- Check AWS Comprehend service health
- Review CloudWatch logs for detailed error messages
- Contact the development team for integration questions
