import { generateText } from "ai";
import { textModel, DEFAULT_CLASSIFY_MAX_TOKENS, DEFAULT_CLASSIFY_TEMPERATURE } from "../../lib/ai";
import { parseJsonResponse } from "../../lib/json-parser";

/**
 * Political bias analysis result interface
 */
export interface PoliticalBiasResult {
  /** Overall bias direction: left, right, center, or none */
  biasDirection: "left" | "right" | "center" | "none";
  /** Bias intensity from 0 (no bias) to 1 (extreme bias) */
  biasIntensity: number;
  /** Confidence in the bias assessment from 0 to 1 */
  confidence: number;
  /** Detailed explanation of the bias analysis */
  explanation: string;
  /** Specific indicators that suggest political bias */
  biasIndicators: string[];
  /** Political topics or themes detected */
  politicalTopics: string[];
  /** Malaysia-specific bias score: 0-30 (Opposition), 31-69 (Neutral), 70-100 (Pro-Government) */
  malaysiaBiasScore?: number;
  /** Whether this content is Malaysia political content */
  isMalaysiaPolitical?: boolean;
  /** Key quote or phrase that contributed most to the bias assessment */
  keyQuote?: string;
}

/**
 * Analyzes content for political bias using AI-powered analysis.
 *
 * This function evaluates content to detect:
 * - Political lean (left, right, center, none)
 * - Intensity of bias
 * - Specific bias indicators
 * - Political themes and topics
 * - Malaysia-specific political bias (if applicable)
 *
 * The function includes fallbacks for when API keys are unavailable,
 * using keyword-based analysis as a backup method.
 *
 * @param content - The content to analyze for political bias
 * @param context - Optional context about the content source
 * @returns Promise resolving to political bias analysis
 *
 * @example
 * ```typescript
 * const result = await analyzePoliticalBias(
 *   "PM Anwar Ibrahim's budget has been hailed as transformative...",
 *   "Social media post about Malaysian politics"
 * );
 *
 * console.log(result.isMalaysiaPolitical); // true
 * console.log(result.malaysiaBiasScore); // 75 (Pro-Government)
 * console.log(result.keyQuote); // "budget has been hailed as transformative"
 * ```
 */
export async function analyzePoliticalBias(
  content: string,
  context?: string
): Promise<PoliticalBiasResult> {
  // Step 1: Check if content is Malaysia political content
  const isMalaysiaPolitical = detectMalaysiaPoliticalContent(content);
  
  // Fallback analysis when API is not available
  if (!process.env.APP_REGION && !process.env.AWS_REGION) {
    const fallbackResult = performKeywordBasedBiasAnalysis(content);
    if (isMalaysiaPolitical) {
      return {
        ...fallbackResult,
        isMalaysiaPolitical: true,
        malaysiaBiasScore: calculateMalaysiaBiasScore(content, fallbackResult),
        keyQuote: extractKeyQuote(content),
      };
    }
    return fallbackResult;
  }

  try {
    // If Malaysia political content, use specialized analysis
    if (isMalaysiaPolitical) {
      return await analyzeMalaysiaPoliticalBias(content, context);
    }

    // Otherwise, perform general political bias analysis
    const prompt = `Analyze the following content for political bias. Consider language patterns, framing, topic selection, and ideological indicators.

Content to analyze:
${content}

${context ? `Context: ${context}` : ""}

Evaluate the content for:
1. Political bias direction (left, right, center, or none)
2. Intensity of bias (0.0 = no bias, 1.0 = extreme bias)
3. Confidence in assessment (0.0 = very uncertain, 1.0 = very confident)
4. Specific indicators that suggest bias
5. Political topics or themes present

Guidelines:
- "left": Progressive/liberal bias (pro-government intervention, social justice focus, anti-conservative framing)
- "right": Conservative bias (pro-traditional values, anti-government overreach, pro-business framing)
- "center": Balanced or moderate perspectives
- "none": Non-political content or neutral reporting

Consider these bias indicators:
- Loaded language and emotional framing
- Selective fact presentation
- Source selection patterns
- Talking points alignment with political movements
- Us vs. them framing
- Conspiracy theories or partisan narratives
- Anti-establishment rhetoric (can lean either direction)

Respond in this exact JSON format:
{
  "biasDirection": "left|right|center|none",
  "biasIntensity": 0.0,
  "confidence": 0.0,
  "explanation": "Detailed analysis of bias patterns found",
  "biasIndicators": ["indicator1", "indicator2"],
  "politicalTopics": ["topic1", "topic2"]
}`;

    const { text: responseText } = await generateText({
      model: textModel(),
      prompt: prompt,
      maxTokens: 800, // Need sufficient tokens for complete JSON response with explanation
      temperature: DEFAULT_CLASSIFY_TEMPERATURE,
    });

    try {
      // Use the robust JSON parser utility
      const parsed = parseJsonResponse(responseText, {
        biasDirection: "neutral",
        biasIntensity: 0,
        confidence: 0.5,
        explanation: "Political bias analysis completed using AI assessment.",
        biasIndicators: [],
        politicalTopics: []
      });
      
      // Check if parsing failed (returned fallback values)
      if (!parsed.biasDirection || parsed.biasDirection === "neutral" && parsed.confidence === 0.5) {
        console.warn("JSON parsing failed or returned fallback values, using keyword analysis");
        return performKeywordBasedBiasAnalysis(content);
      }
      
      // Validate and normalize the response
      return {
        biasDirection: validateBiasDirection(parsed.biasDirection),
        biasIntensity: Math.max(0, Math.min(1, parsed.biasIntensity || 0)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        explanation: parsed.explanation || "Political bias analysis completed using AI assessment.",
        biasIndicators: Array.isArray(parsed.biasIndicators) ? parsed.biasIndicators : [],
        politicalTopics: Array.isArray(parsed.politicalTopics) ? parsed.politicalTopics : [],
        isMalaysiaPolitical: false,
      };
    } catch (parseError) {
      console.warn("Failed to parse political bias analysis response:", parseError);
      console.warn("Response text:", responseText.substring(0, 500));
      return performKeywordBasedBiasAnalysis(content);
    }
  } catch (error) {
    console.warn("Failed to analyze political bias:", error);
    return performKeywordBasedBiasAnalysis(content);
  }
}

/**
 * Malaysia-specific political keywords and entities
 */
const MALAYSIA_POLITICAL_KEYWORDS = {
  government: [
    "parliament", "dewan rakyat", "dewan negara",
    "prime minister", "pm", "cabinet", "government", "administration",
    "ge16", "ge15", "pru16", "pru15", "election", "general election",
    "budget", "manifesto", "policy", "subsidy", "subsidies",
    "federal", "state assembly", "minister", "mps", "bill", "motion",
    "governing coalition", "unity government", "pmx"
  ],

  governmentParties: [
    "pakatan harapan", "ph", "barisan nasional", "bn", "dap", "pkr", "amanah",
    "umno", "mic", "mca", "democratic action party", "parti keadilan rakyat",
    "unity government", "madani government"
  ],

  oppositionParties: [
    "perikatan nasional", "pn", "bersatu", "pas", "gerakan",
    "parti pribumi bersatu malaysia", "parti islam se-malaysia",
    "gagasan sejahtera", "gs"
  ],

  politicalFigures: [
    "anwar ibrahim", "anwar", "zahid hamidi", "zahid", "anthony loke",
    "lim guan eng", "guan eng", "saifuddin nasution", "muhyiddin yassin",
    "muhyiddin", "hadi awang", "hadi", "hamzah zainudin", "hamzah",
    "najib razak", "najib", "mukhriz mahathir", "mukhriz", "mahathir",
    "rafizi ramli", "rafizi", "nurul izzah", "hannah yeoh", "khairy jamaluddin",
    "khairy", "isyam jalil", "ismail sabri", "is-mail sabri", "wan azizah",
    "mat sabu", "azmin ali", "azmin"
  ],

  // Optional: slang & shorthand often used online
  slang: [
    "kerajaan", "pembangkang", "madani", "umno-bn", "ph-bn", "pn-bn",
    "pro-gov", "anti-gov", "pro kerajaan", "anti kerajaan"
  ],

  // Sarcasm and criticism indicators (Malay)
  sarcasm: [
    "halalkan", "konon", "katanya", "kononnya", "so ni", "cubaan",
    "entah-entah", "la sangat", "macam betul", "ye ke"
  ],

  // Rhetorical question markers (criticism)
  rhetoricalMarkers: [
    "ke?", "eh?", "kan?", "kah?", "meh?", "la?", "ni?",
    "apa ni", "macam mana ni", "betul ke"
  ],

  // Criticism and questioning legitimacy phrases
  criticismPhrases: [
    "cubaan halalkan", "kononnya sah", "tak logik", "merepek",
    "tipu rakyat", "bohong", "penipu", "manipulasi", "spin",
    "propaganda", "bayar", "upah", "gaji buta", "crony"
  ]
};


/**
 * Detects if content is Malaysia political content using NER and keyword matching
 */
function detectMalaysiaPoliticalContent(content: string): boolean {
  const lowercaseContent = content.toLowerCase();
  
  // Uniquely Malaysian terms that are strong standalone indicators
  const uniqueMalaysiaTerms = [
    "pmx", "madani", "kerajaan", "pembangkang", "dewan rakyat", "dewan negara",
    "pru16", "pru15", "ge16", "ge15", "pakatan harapan", "perikatan nasional",
    "barisan nasional", "umno", "pas", "dap", "pkr", "bersatu", "amanah"
  ];
  
  const matchedKeywords: string[] = [];
  
  // Check for unique Malaysia terms (these imply Malaysia context automatically)
  let hasUniqueMalaysiaTerm = false;
  for (const term of uniqueMalaysiaTerms) {
    if (lowercaseContent.includes(term)) {
      hasUniqueMalaysiaTerm = true;
      matchedKeywords.push(`[Unique] ${term}`);
    }
  }
  
  // Check for explicit Malaysia context
  const hasMalaysiaContext = 
    hasUniqueMalaysiaTerm ||
    lowercaseContent.includes("malaysia") ||
    lowercaseContent.includes("malaysian") ||
    lowercaseContent.includes("putrajaya") ||
    lowercaseContent.includes("kuala lumpur") ||
    lowercaseContent.includes("kl");
  
  // Count political indicators
  let politicalIndicatorCount = 0;
  
  // Check government keywords
  MALAYSIA_POLITICAL_KEYWORDS.government.forEach(keyword => {
    if (lowercaseContent.includes(keyword)) {
      politicalIndicatorCount++;
      matchedKeywords.push(`[Gov] ${keyword}`);
    }
  });
  
  // Check party names
  [...MALAYSIA_POLITICAL_KEYWORDS.governmentParties, ...MALAYSIA_POLITICAL_KEYWORDS.oppositionParties].forEach(party => {
    if (lowercaseContent.includes(party)) {
      politicalIndicatorCount += 2; // Weight party mentions more heavily
      matchedKeywords.push(`[Party] ${party}`);
    }
  });
  
  // Check political figures
  MALAYSIA_POLITICAL_KEYWORDS.politicalFigures.forEach(figure => {
    if (lowercaseContent.includes(figure)) {
      politicalIndicatorCount += 2; // Weight figure mentions more heavily
      matchedKeywords.push(`[Figure] ${figure}`);
    }
  });
  
  // Check slang/shorthand (strong indicators of Malaysia political content)
  if (MALAYSIA_POLITICAL_KEYWORDS.slang) {
    MALAYSIA_POLITICAL_KEYWORDS.slang.forEach(slang => {
      if (lowercaseContent.includes(slang)) {
        politicalIndicatorCount += 2; // Weight slang heavily as it's very specific to Malaysia politics
        matchedKeywords.push(`[Slang] ${slang}`);
      }
    });
  }
  
  const isDetected = (hasMalaysiaContext && politicalIndicatorCount >= 1) || politicalIndicatorCount >= 3;
  
  // Debug logging
  if (isDetected) {
    console.log("🔍 Malaysia Political Content DETECTED");
    console.log("📝 Matched Keywords:", matchedKeywords);
    console.log("📊 Total Political Score:", politicalIndicatorCount);
    console.log("🇲🇾 Has Malaysia Context:", hasMalaysiaContext);
  }
  
  // Content is Malaysia political if:
  // 1. Has Malaysia context AND at least 1 political indicator, OR
  // 2. Has strong political indicators (3+ points) even without explicit Malaysia mention
  return isDetected;
}

/**
 * Analyzes Malaysia-specific political bias with AI
 */
async function analyzeMalaysiaPoliticalBias(
  content: string,
  context?: string
): Promise<PoliticalBiasResult> {
  const prompt = `Analyze the following Malaysian political content for bias. Focus specifically on how the content frames the current government coalition (Pakatan Harapan + Barisan Nasional) versus the opposition (Perikatan Nasional).

Content to analyze:
${content}

${context ? `Context: ${context}` : ""}

Malaysian Political Context:
- Current Government Coalition: Pakatan Harapan (PH) + Barisan Nasional (BN) - Led by PM Anwar Ibrahim
  - Parties: DAP, PKR, Amanah, UMNO, MIC, MCA
  - Key figures: Anwar Ibrahim, Zahid Hamidi, Anthony Loke, Lim Guan Eng, Saifuddin Nasution
- Opposition Coalition: Perikatan Nasional (PN)
  - Parties: Bersatu, PAS, Gerakan
  - Key figures: Muhyiddin Yassin, Hadi Awang, Hamzah Zainudin

Analyze the content and provide:
1. A bias score from 0-100:
   - 0-30: Opposition-leaning (frames government negatively, praises opposition, critical of current administration)
   - 31-69: Neutral/Mixed (balanced tone, no clear alignment, or presents both sides)
   - 70-100: Pro-Government (frames government policies positively, praises leaders, portrays opposition negatively)

2. A detailed explanation (2-3 lines) describing the framing patterns

3. Extract ONE key quote or phrase (10-20 words) that most strongly contributed to the bias assessment

4. List specific bias indicators found in the text

5. Confidence level in the assessment (0.0 to 1.0)

CRITICAL ANALYSIS RULES:
A. SARCASM & CRITICISM DETECTION (Malay/English):
   - Words like "halalkan", "konon", "katanya", "kononnya", "so ni" indicate SARCASM → lean opposition
   - Rhetorical questions with "ke?", "eh?", "kan?", "kah?" often indicate CRITICISM → lean opposition
   - Phrases questioning legitimacy ("cubaan halalkan", "kononnya sah", "tak logik") → lean opposition
   - If content QUESTIONS government actions sarcastically → score 0-30 (opposition-leaning)

B. TARGET-AWARE SENTIMENT:
   - DON'T just detect sentiment polarity
   - IDENTIFY the TARGET: Is criticism aimed at government or opposition?
   - If negative sentiment targets GOVERNMENT → opposition-leaning (0-30)
   - If negative sentiment targets OPPOSITION → pro-government (70-100)

C. CONTEXT MATTERS:
   - "Defending PMX from critics" → pro-government (70-100)
   - "Questioning PMX's actions" → opposition-leaning (0-30)
   - "This guy badmouthing PMX is wrong" → pro-government (defending PM)
   - "So this is how they justify PH+BN?" → opposition-leaning (sarcastic question)

Consider these framing patterns:
- Language used to describe government vs opposition actions
- Attribution of blame or credit
- Selection of quotes and whose voices are amplified
- Emotional language and loaded terms
- Portrayal of policies as beneficial vs harmful
- Portrayal of leaders as competent vs incompetent
- **Sarcasm, rhetorical questions, and irony**
- **Target of criticism (who is being criticized?)**

Respond in this exact JSON format:
{
  "malaysiaBiasScore": 50,
  "explanation": "2-3 line explanation of framing patterns",
  "keyQuote": "The most relevant quote from the content",
  "biasIndicators": ["indicator1", "indicator2"],
  "politicalTopics": ["topic1", "topic2"],
  "confidence": 0.8
}`;

  try {
    const { text: responseText } = await generateText({
      model: textModel(),
      prompt: prompt,
      maxTokens: 1000, // Need sufficient tokens for Malaysia-specific analysis
      temperature: DEFAULT_CLASSIFY_TEMPERATURE,
    });

    // Use the robust JSON parser utility
    const parsed = parseJsonResponse(responseText, {
      malaysiaBiasScore: 50,
      explanation: "Malaysia political bias analysis completed using AI assessment.",
      keyQuote: "",
      confidence: 0.5,
      biasIndicators: [],
      politicalTopics: []
    });
    
    // Check if parsing failed (returned fallback values)
    if (parsed.malaysiaBiasScore === 50 && parsed.confidence === 0.5) {
      console.warn("Malaysia bias JSON parsing failed, using fallback analysis");
      const fallbackResult = performKeywordBasedBiasAnalysis(content);
      return {
        ...fallbackResult,
        isMalaysiaPolitical: true,
        malaysiaBiasScore: calculateMalaysiaBiasScore(content, fallbackResult),
        keyQuote: extractKeyQuote(content),
      };
    }
    
    const biasScore = Math.max(0, Math.min(100, parsed.malaysiaBiasScore || 50));
    
    // Debug logging for AI analysis
    console.log("🤖 AI Bias Analysis Result:");
    console.log("   Bias Score:", biasScore);
    console.log("   Explanation:", parsed.explanation?.substring(0, 100) + "...");
    console.log("   Key Quote:", parsed.keyQuote);
    console.log("   Confidence:", parsed.confidence);
    
    // Determine general bias direction from Malaysia score
    let biasDirection: "left" | "right" | "center" | "none" = "center";
    let biasIntensity = 0.5;
    
    if (biasScore <= 30) {
      biasDirection = "left"; // Opposition-leaning
      biasIntensity = 1 - (biasScore / 30); // 0-30 maps to 1.0-0.67 intensity
    } else if (biasScore >= 70) {
      biasDirection = "right"; // Pro-Government
      biasIntensity = (biasScore - 70) / 30; // 70-100 maps to 0.67-1.0 intensity
    } else {
      biasDirection = "center";
      biasIntensity = 0.3 + Math.abs(50 - biasScore) / 200; // Slight intensity for slight leans
    }
    
    return {
      biasDirection,
      biasIntensity,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      explanation: parsed.explanation || "Malaysia political bias analysis completed.",
      biasIndicators: Array.isArray(parsed.biasIndicators) ? parsed.biasIndicators : [],
      politicalTopics: Array.isArray(parsed.politicalTopics) ? parsed.politicalTopics : [],
      malaysiaBiasScore: biasScore,
      isMalaysiaPolitical: true,
      keyQuote: parsed.keyQuote || extractKeyQuote(content),
    };
  } catch (error) {
    console.warn("Failed to analyze Malaysia political bias:", error);
    // Fallback to keyword-based analysis with Malaysia scoring
    const fallbackResult = performKeywordBasedBiasAnalysis(content);
    return {
      ...fallbackResult,
      isMalaysiaPolitical: true,
      malaysiaBiasScore: calculateMalaysiaBiasScore(content, fallbackResult),
      keyQuote: extractKeyQuote(content),
    };
  }
}

/**
 * Calculates Malaysia bias score (0-100) from keyword-based analysis
 */
function calculateMalaysiaBiasScore(content: string, biasResult: PoliticalBiasResult): number {
  const lowercaseContent = content.toLowerCase();
  
  // Check for pro-government indicators
  let proGovScore = 0;
  const proGovIndicators = [
    "hailed", "transformative", "praised", "beneficial", "progressive", "reform",
    "successful", "achievement", "commitment", "delivers", "implemented successfully",
    "excellent", "outstanding", "visionary", "strong leadership"
  ];
  proGovIndicators.forEach(indicator => {
    if (lowercaseContent.includes(indicator)) proGovScore++;
  });
  
  // Check for opposition-leaning indicators
  let oppositionScore = 0;
  const oppositionIndicators = [
    "blocked", "criticized", "failed", "irresponsible", "corrupt", "mismanagement",
    "scandal", "controversy", "questioned", "disputed", "rejected", "incompetent"
  ];
  oppositionIndicators.forEach(indicator => {
    if (lowercaseContent.includes(indicator)) oppositionScore++;
  });

  // CRITICAL: Check for sarcasm and criticism (strong opposition indicators)
  let sarcasmScore = 0;
  if (MALAYSIA_POLITICAL_KEYWORDS.sarcasm) {
    MALAYSIA_POLITICAL_KEYWORDS.sarcasm.forEach(sarcasm => {
      if (lowercaseContent.includes(sarcasm)) {
        sarcasmScore += 2; // Weight sarcasm heavily
      }
    });
  }

  // Check for rhetorical questions (criticism)
  let rhetoricalScore = 0;
  if (MALAYSIA_POLITICAL_KEYWORDS.rhetoricalMarkers) {
    MALAYSIA_POLITICAL_KEYWORDS.rhetoricalMarkers.forEach(marker => {
      if (lowercaseContent.includes(marker)) {
        rhetoricalScore += 1.5; // Rhetorical questions often indicate criticism
      }
    });
  }

  // Check for explicit criticism phrases
  let criticismScore = 0;
  if (MALAYSIA_POLITICAL_KEYWORDS.criticismPhrases) {
    MALAYSIA_POLITICAL_KEYWORDS.criticismPhrases.forEach(phrase => {
      if (lowercaseContent.includes(phrase)) {
        criticismScore += 3; // Strong criticism indicator
      }
    });
  }

  // ========================================
  // CRITICAL: TARGET DETECTION
  // Detect WHO is being criticized/discussed
  // ========================================
  
  // Government target keywords (PH+BN coalition)
  const targetsGovernment = 
    /\b(ph|pakatan harapan|pakatan|bn|barisan nasional|barisan|kerajaan|government|pmx|anwar|zahid|anthony loke|lim guan eng|dap|pkr|umno|amanah|madani)\b/i.test(lowercaseContent);
  
  // Opposition target keywords (PN coalition)
  const targetsOpposition = 
    /\b(pn|perikatan nasional|perikatan|pas|bersatu|gerakan|muhyiddin|hadi|hamzah|gagasan sejahtera)\b/i.test(lowercaseContent);
  
  // Check if content is questioning/criticizing with target awareness
  const hasCriticalTone = sarcasmScore > 0 || rhetoricalScore > 0 || criticismScore > 0;
  
  // Calculate base score (50 = neutral)
  let score = 50;
  
  // Adjust based on general indicators
  score += (proGovScore * 7); // Each pro-gov indicator adds 7 points
  score -= (oppositionScore * 7); // Each opposition indicator subtracts 7 points
  score -= (sarcasmScore * 10); // Sarcasm heavily pushes toward opposition
  score -= (rhetoricalScore * 8); // Rhetorical questions push toward opposition
  score -= (criticismScore * 12); // Explicit criticism heavily pushes toward opposition

  // ========================================
  // TARGET-AWARE ADJUSTMENTS (MOST IMPORTANT)
  // ========================================
  
  // If criticism/sarcasm targets GOVERNMENT → Opposition-leaning
  if (targetsGovernment && hasCriticalTone) {
    score -= 20; // Strong push toward opposition
    console.log("🎯 Target Detection: Criticism aimed at GOVERNMENT → Opposition-leaning");
  }
  
  // If criticism/sarcasm targets OPPOSITION → Pro-Government
  if (targetsOpposition && hasCriticalTone) {
    score += 20; // Strong push toward pro-government
    console.log("🎯 Target Detection: Criticism aimed at OPPOSITION → Pro-Government");
  }

  // Special case: If ONLY government mentioned with criticism (no opposition), stronger opposition lean
  if (targetsGovernment && !targetsOpposition && hasCriticalTone) {
    score = Math.min(score, 25); // Cap at strong opposition lean
    console.log("🎯 Exclusive Government Criticism → Capping at 25 (strong opposition)");
  }

  // Special case: If ONLY opposition mentioned with criticism (no government), stronger pro-gov lean
  if (targetsOpposition && !targetsGovernment && hasCriticalTone) {
    score = Math.max(score, 75); // Floor at strong pro-government
    console.log("🎯 Exclusive Opposition Criticism → Flooring at 75 (strong pro-gov)");
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Extracts a key quote from the content (first sentence or up to 100 chars)
 */
function extractKeyQuote(content: string): string {
  // Try to get first sentence
  const sentences = content.split(/[.!?]+/);
  if (sentences.length > 0 && sentences[0].trim()) {
    const quote = sentences[0].trim();
    return quote.length > 100 ? quote.substring(0, 97) + "..." : quote;
  }
  
  // Fallback to first 100 characters
  return content.length > 100 ? content.substring(0, 97) + "..." : content;
}

/**
 * Fallback keyword-based political bias analysis
 */
function performKeywordBasedBiasAnalysis(content: string): PoliticalBiasResult {
  const lowercaseContent = content.toLowerCase();
  
  // Left-leaning indicators
  const leftKeywords = [
    "social justice", "systemic racism", "climate change", "progressive",
    "medicare for all", "wealth inequality", "corporate greed", "fascist",
    "far-right", "extremist", "diversity", "inclusion", "lgbtq",
    "reproductive rights", "gun control", "minimum wage"
  ];
  
  // Right-leaning indicators
  const rightKeywords = [
    "mainstream media", "fake news", "deep state", "socialist",
    "communist", "radical left", "freedom", "patriot", "constitution",
    "second amendment", "traditional values", "law and order",
    "border security", "america first", "liberal bias", "woke"
  ];
  
  // Political topic indicators
  const politicalTopics = [
    "election", "trump", "biden", "democrat", "republican", "politics",
    "government", "congress", "senate", "supreme court", "immigration",
    "healthcare", "economy", "foreign policy"
  ];
  
  let leftScore = 0;
  let rightScore = 0;
  const detectedTopics: string[] = [];
  const indicators: string[] = [];
  
  // Count left-leaning keywords
  leftKeywords.forEach(keyword => {
    if (lowercaseContent.includes(keyword)) {
      leftScore++;
      indicators.push(`Left indicator: "${keyword}"`);
    }
  });
  
  // Count right-leaning keywords
  rightKeywords.forEach(keyword => {
    if (lowercaseContent.includes(keyword)) {
      rightScore++;
      indicators.push(`Right indicator: "${keyword}"`);
    }
  });
  
  // Detect political topics
  politicalTopics.forEach(topic => {
    if (lowercaseContent.includes(topic)) {
      detectedTopics.push(topic);
    }
  });
  
  // Determine bias direction and intensity
  let biasDirection: "left" | "right" | "center" | "none" = "none";
  let biasIntensity = 0;
  let confidence = 0.6;
  let explanation = "Keyword-based analysis used as fallback. ";
  
  if (leftScore > rightScore && leftScore > 0) {
    biasDirection = "left";
    biasIntensity = Math.min(0.8, leftScore * 0.2);
    explanation += `Detected ${leftScore} left-leaning indicators.`;
  } else if (rightScore > leftScore && rightScore > 0) {
    biasDirection = "right";
    biasIntensity = Math.min(0.8, rightScore * 0.2);
    explanation += `Detected ${rightScore} right-leaning indicators.`;
  } else if (leftScore === rightScore && leftScore > 0) {
    biasDirection = "center";
    biasIntensity = 0.3;
    explanation += "Detected balanced political indicators.";
  } else if (detectedTopics.length > 0) {
    biasDirection = "center";
    biasIntensity = 0.1;
    explanation += "Political topics detected but no clear bias direction.";
    confidence = 0.4;
  } else {
    explanation += "No significant political bias indicators detected.";
    confidence = 0.7;
  }
  
  return {
    biasDirection,
    biasIntensity,
    confidence,
    explanation,
    biasIndicators: indicators.slice(0, 5), // Limit to top 5 indicators
    politicalTopics: detectedTopics.slice(0, 3), // Limit to top 3 topics
  };
}

/**
 * Validates and normalizes bias direction value
 */
function validateBiasDirection(value: unknown): "left" | "right" | "center" | "none" {
  const validDirections = ["left", "right", "center", "none"];
  if (typeof value === "string" && validDirections.includes(value)) {
    return value as "left" | "right" | "center" | "none";
  }
  return "none";
}
