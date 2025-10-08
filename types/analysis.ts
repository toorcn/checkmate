export interface FactCheckResult {
  verdict: "verified" | "misleading" | "false" | "unverified" | "satire" | "partially_true" | "outdated" | "exaggerated" | "opinion" | "rumor" | "conspiracy" | "debunked";
  confidence: number;
  explanation: string;
  content: string;
  sources: Array<{
    url: string;
    title: string;
    credibility: number;
  }>;
  flags: string[];
  originTracing?: {
    hypothesizedOrigin?: string;
    firstSeenDates?: Array<{ source: string; date?: string; url?: string }>;
    propagationPaths?: string[];
  };
  beliefDrivers?: Array<{
    name: string;
    description: string;
    references?: Array<{ title: string; url: string }>;
  }>;
}

export interface TranscriptionData {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
}

export interface TikTokTranscriptionData {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  language: string;
}

export interface Metadata {
  title: string;
  description: string;
  creator: string;
  originalUrl: string;
  platform: string;
}

export interface NewsDetection {
  hasNewsContent: boolean;
  confidence: number;
  newsKeywordsFound: string[];
  potentialClaims: string[];
  needsFactCheck: boolean;
  contentType: string;
}

export interface AnalysisData {
  transcription: TranscriptionData;
  metadata: Metadata;
  factCheck: FactCheckResult;
  requiresFactCheck: boolean;
  creatorCredibilityRating: number;
  newsDetection: NewsDetection;
  originTracingData?: any;
}

export interface TikTokAnalysisData {
  transcription: TikTokTranscriptionData;
  metadata: Metadata;
  factCheck: any; // Using any for now to handle the existing structure
  requiresFactCheck: boolean;
  creatorCredibilityRating: number;
  newsDetection: NewsDetection;
  originTracingData?: any;
}

export interface AnalysisResult {
  success: boolean;
  data?: AnalysisData;
  error?: string;
}

export interface TikTokAnalysisResult {
  success: boolean;
  data?: TikTokAnalysisData;
  error?: string;
}

export interface MockResult {
  success: boolean;
  data: AnalysisData;
}
