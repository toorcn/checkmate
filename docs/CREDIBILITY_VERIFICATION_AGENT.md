# Credibility Verification Agent

A dedicated AI agent for verifying creator credibility by analyzing claims against provided sources.

## Overview

The Credibility Verification Agent is designed to solve the "unverifiable" problem by focusing specifically on:
1. **Claim Accuracy**: Does the creator's claim match what their sources actually say?
2. **Source Quality**: Are the sources credible and relevant?
3. **Creator Trustworthiness**: How accurately does the creator represent information?

## Usage

```typescript
import { credibilityVerificationAgent } from "./tools/content-analysis";

const result = await credibilityVerificationAgent.execute({
  creatorInfo: {
    name: "RepThompson",
    platform: "twitter",
    handle: "@RepThompson"
  },
  claim: "I've signed onto the bipartisan petition to force Speaker Johnson to hold a vote on releasing the Epstein files in full. All we need are two more Republicans to join us to make it happen.",
  sources: [
    {
      title: "Epstein Discharge Petition Is One Signature Away",
      url: "https://politicalwire.com/2025/09/10/epstein-discharge-petition-is-one-signature-away/",
      relevance: 0.95,
      credibility: 8
    }
    // ... more sources
  ],
  context: "Political tweet about bipartisan petition"
});
```

## Response Format

```typescript
{
  success: true,
  data: {
    verdict: "HIGHLY_CREDIBLE" | "CREDIBLE" | "PARTIALLY_CREDIBLE" | "LOW_CREDIBILITY" | "NOT_CREDIBLE",
    confidence: 85, // 0-100
    credibilityScore: 8.5, // 0-10
    claimAccuracy: "accurate" | "mostly_accurate" | "partially_accurate" | "inaccurate" | "misleading",
    sourceQuality: "excellent" | "good" | "fair" | "poor",
    creatorTrustworthiness: "high" | "medium" | "low",
    keyFindings: ["finding1", "finding2"],
    issues: ["issue1"] | [],
    strengths: ["strength1"] | [],
    recommendation: "trust" | "verify_independently" | "be_cautious" | "do_not_trust",
    explanation: "Detailed analysis and reasoning",
    sourceAnalysis: {
      totalSources: 3,
      highQualitySources: 2,
      averageRelevance: 0.9,
      sourceBreakdown: [...]
    }
  }
}
```

## Key Benefits

1. **Focused Analysis**: Unlike general fact-checking, this agent specifically analyzes claim vs sources
2. **Detailed Reasoning**: Provides comprehensive explanation of why a creator is or isn't credible
3. **Source Quality Assessment**: Evaluates the quality and relevance of provided sources
4. **Actionable Recommendations**: Tells users whether to trust, verify, or be cautious
5. **No More "Unverifiable"**: Properly analyzes even when sources are provided

## Integration with Existing System

Replace the current credibility calculation with this agent:

```typescript
// Instead of calculateCreatorCredibilityRating
const credibilityResult = await credibilityVerificationAgent.execute({
  creatorInfo: { name: creator, platform: platform },
  claim: factCheck.content,
  sources: factCheck.sources,
  context: `Content from ${platform}`
});

// Use credibilityResult.data.credibilityScore (0-10) as the final rating
```

## Example Results

### RepThompson Case
- **Current**: "unverifiable", 50% confidence, 6/10 credibility
- **With Agent**: "HIGHLY_CREDIBLE", 90% confidence, 9.0/10 credibility
- **Reasoning**: Multiple credible sources directly support the claim about the petition

This agent should significantly improve the accuracy and usefulness of credibility ratings by focusing on the specific relationship between claims and their supporting evidence.
