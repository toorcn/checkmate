# Political Bias Meter Feature Documentation

## Overview

The Political Bias Meter is a specialized feature that analyzes Malaysia-related political content and provides awareness about potential framing biases in the content. This feature only activates when the content is detected to be political and Malaysia-related.

## Features Implemented

### 1. Intelligent Trigger Conditions

The system uses Named Entity Recognition (NER) and keyword matching to detect political context:

#### Government-Related Keywords
- `parliament`, `prime minister`, `pm`, `cabinet`, `GE16`, `GE15`, `election`
- `budget`, `ministry`, `government`, `policy`, `subsidy`, `manifesto`
- `dewan rakyat`, `dewan negara`, `federal`, `state assembly`

#### Political Party Names

**Government Coalition:**
- Pakatan Harapan (PH): `DAP`, `PKR`, `Amanah`
- Barisan Nasional (BN): `UMNO`, `MIC`, `MCA`

**Opposition Coalition:**
- Perikatan Nasional (PN): `Bersatu`, `PAS`, `Gerakan`

#### Political Figures
- **Government**: Anwar Ibrahim, Zahid Hamidi, Anthony Loke, Lim Guan Eng, Saifuddin Nasution
- **Opposition**: Muhyiddin Yassin, Hadi Awang, Hamzah Zainudin
- **Historical**: Najib Razak, Mukhriz Mahathir, Mahathir

### 2. Bias Analysis Logic

When triggered, the system performs sentiment and framing analysis using AI:

#### Scoring Scale (0-100)
- **0-30**: Opposition-leaning
  - Content frames government negatively
  - Praises opposition
  - Uses language critical of current administration
  
- **31-69**: Neutral / Mixed
  - Balanced tone
  - No clear alignment
  - Presents both sides

- **70-100**: Pro-Government
  - Frames government policies positively
  - Praises government leaders
  - Portrays opposition negatively

#### Analysis Factors
- Language used to describe government vs opposition actions
- Attribution of blame or credit
- Selection of quotes and whose voices are amplified
- Emotional language and loaded terms
- Portrayal of policies as beneficial vs harmful
- Portrayal of leaders as competent vs incompetent

### 3. Frontend Display

The Political Bias Meter is displayed as a horizontal awareness meter:

```
Be aware:
0 ───────────────────────────────●────────────────────────────── 100
     (Likely leaning toward Opposition / Pro-Government)
```

**Key Features:**
- **Visual Meter**: Horizontal gradient from blue (Opposition) through gray (Neutral) to green (Pro-Government)
- **Position Indicator**: A dot shows the bias position without revealing the exact score
- **Scale Labels**: Shows 0, 50, and 100 markers
- **Category Label**: Displays the general bias direction
- **Explanation**: 2-3 line description of framing patterns
- **Key Quote**: Displays an example phrase that contributed to the assessment
- **Confidence Indicator**: Shows low confidence warning if applicable
- **Disclaimer**: Clarifies that the meter identifies framing, not factual accuracy

### 4. Fallback Behavior

- If content is **not political**: No bias meter is rendered
- If content is **not Malaysia-related**: No bias meter is rendered
- If AI analysis fails: Falls back to keyword-based analysis
- If no API keys available: Uses keyword-based scoring with lower confidence

## Implementation Details

### Files Modified/Created

1. **`tools/fact-checking/political-bias-analysis.ts`**
   - Added Malaysia-specific keyword detection
   - Implemented `detectMalaysiaPoliticalContent()` function
   - Implemented `analyzeMalaysiaPoliticalBias()` with AI-powered analysis
   - Added `calculateMalaysiaBiasScore()` for fallback keyword-based scoring
   - Added `extractKeyQuote()` to highlight influential phrases

2. **`components/ui/political-bias-meter.tsx`** (NEW)
   - React component for displaying the bias meter
   - Responsive design with dark mode support
   - Gradient visualization with position indicator
   - Explanation and quote display

3. **`components/analyses-content.tsx`**
   - Integrated PoliticalBiasMeter component
   - Conditional rendering based on `isMalaysiaPolitical` flag

4. **`components/hero-section.tsx`**
   - Integrated PoliticalBiasMeter component
   - Conditional rendering for Malaysia political content

5. **Handler Files** (Already integrated)
   - `app/api/transcribe/handlers/tiktok-handler.ts`
   - `app/api/transcribe/handlers/twitter-handler.ts`
   - `app/api/transcribe/handlers/web-handler.ts`
   - All handlers call `analyzePoliticalBias()` during fact-checking

### Data Flow

```
Content Input
    ↓
Transcription/Extraction
    ↓
Fact-Checking Pipeline
    ↓
Political Bias Detection (keyword + NER)
    ↓
[If Malaysia Political Content Detected]
    ↓
AI-Powered Bias Analysis
    ↓
Generate 0-100 Bias Score
    ↓
Extract Key Quote
    ↓
Return Analysis Result
    ↓
UI Conditionally Renders Meter
```

### Interface Structure

```typescript
interface PoliticalBiasResult {
  biasDirection: "left" | "right" | "center" | "none";
  biasIntensity: number; // 0-1 scale
  confidence: number; // 0-1 scale
  explanation: string;
  biasIndicators: string[];
  politicalTopics: string[];
  malaysiaBiasScore?: number; // 0-100 scale
  isMalaysiaPolitical?: boolean;
  keyQuote?: string;
}
```

## Usage Example

When analyzing a tweet like:

> "PM Anwar Ibrahim's budget has been hailed as a transformative step for the rakyat, despite criticism from PN leaders who called it fiscally irresponsible."

**Expected Output:**
- **Score**: ~75-80 (Pro-Government)
- **Category**: "Likely leaning toward Pro-Government"
- **Explanation**: "The article consistently praises government initiatives while portraying the opposition as obstructive. Uses positive framing ('hailed', 'transformative') for government and negative framing ('criticism', 'irresponsible') for opposition."
- **Key Quote**: "budget has been hailed as a transformative step for the rakyat"

## Testing

To test the feature, use any of these platforms:
- **TikTok**: Videos discussing Malaysian politics
- **Twitter/X**: Posts from Malaysian political accounts
- **Web Articles**: News articles from Malaysian media

Example test URL:
```
https://x.com/theedgemalaysia/status/1974373897119412457
```

## Best Practices

1. **Not a Fact-Checker**: The bias meter identifies framing patterns, not factual accuracy
2. **Context Matters**: Consider the source, audience, and purpose of the content
3. **Multiple Sources**: Cross-reference with multiple news sources for balanced understanding
4. **Human Judgment**: Use the meter as one of many tools for media literacy

## Future Enhancements

Potential improvements for future versions:
- Track bias patterns across multiple posts from the same creator
- Compare bias scores across different sources covering the same event
- Add temporal analysis to show how bias changes over time
- Expand to cover other countries and political contexts
- Add multilingual support for Bahasa Malaysia content

## Troubleshooting

### Meter Not Showing
- Verify content contains Malaysia political keywords
- Check that AI API keys are configured (`AWS_REGION`, `BEDROCK_MODEL_ID`)
- Confirm factCheck.politicalBias data exists in analysis result

### Incorrect Classification
- Review keyword lists in `MALAYSIA_POLITICAL_KEYWORDS`
- Check AI prompt in `analyzeMalaysiaPoliticalBias()`
- Verify confidence score (low confidence may indicate unclear framing)

### Performance Issues
- Monitor AI API latency (consider caching results)
- Optimize keyword matching for large texts
- Use fallback keyword analysis when AI is slow

## Contributing

To add new political keywords or figures:
1. Edit `MALAYSIA_POLITICAL_KEYWORDS` in `political-bias-analysis.ts`
2. Add keywords to appropriate category (government, parties, figures)
3. Test with real-world examples
4. Submit pull request with examples demonstrating the need for new keywords
