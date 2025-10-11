"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  XCircleIcon,
  SmileIcon,
  SearchIcon,
  BrainIcon,
  BarChart3Icon,
  FileTextIcon,
} from "lucide-react";
import { OriginTracingDiagram } from "@/components/analysis/origin-tracing-diagram";
import { SentimentDisplay } from "@/components/analysis/sentiment-display";
import { PoliticalBiasMeter } from "@/components/ui/political-bias-meter";
import { FactCheckResult } from "@/types/analysis";
import {
  VerdictOverviewCard,
  AnalysisOverviewCard,
  MetricsOverviewCard,
  SentimentOverviewCard,
  PoliticalBiasOverviewCard,
} from "./analysis-overview-cards";
import {
  AnalysisDetailModal,
  VerdictDetailContent,
  SourcesDetailContent,
  BeliefDriversDetailContent,
} from "./analysis-detail-modal";
import { calculateSentimentVerdictCorrelation } from "@/lib/sentiment-verdict-correlation";

interface VerdictGlossaryItem {
  verdict: string;
  label: string;
  definition: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
}

function VerdictGlossary() {
  const verdictTypes: VerdictGlossaryItem[] = [
    {
      verdict: "verified",
      label: "Verified",
      definition: "Clear evidence from multiple credible sources supports the claims made in this content.",
      icon: <CheckCircleIcon className="h-4 w-4 text-foreground" />,
      badge: (
        <Badge className="bg-primary/10 text-primary border border-primary/20">
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      ),
    },
    {
      verdict: "false",
      label: "False Information",
      definition: "The claims are factually incorrect and contradicted by credible evidence from reliable sources.",
      icon: <XCircleIcon className="h-4 w-4 text-destructive" />,
      badge: (
        <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
          <XCircleIcon className="h-3 w-3 mr-1" />
          False Information
        </Badge>
      ),
    },
    {
      verdict: "misleading",
      label: "Misleading Content",
      definition: "The content lacks important context, presents selective information, or draws unsupported conclusions.",
      icon: <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertTriangleIcon className="h-3 w-3 mr-1" />
          Misleading Content
        </Badge>
      ),
    },
    {
      verdict: "unverified",
      label: "Insufficient Evidence",
      definition: "Not enough credible evidence is available to verify or debunk the claims. Further investigation needed.",
      icon: <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          Insufficient Evidence
        </Badge>
      ),
    },
    {
      verdict: "satire",
      label: "Satirical Content",
      definition: "This content is satirical, parody, or comedy in nature and should not be interpreted as factual.",
      icon: <span className="text-muted-foreground text-sm">🎭</span>,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <SmileIcon className="h-3 w-3 mr-1" />
          Satirical Content
        </Badge>
      ),
    },
    {
      verdict: "partially_true",
      label: "Partially True",
      definition: "Contains both accurate and inaccurate elements. Some claims are supported while others are not.",
      icon: <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertTriangleIcon className="h-3 w-3 mr-1" />
          Partially True
        </Badge>
      ),
    },
    {
      verdict: "outdated",
      label: "Outdated Information",
      definition: "This information was accurate at one time but has been superseded by newer evidence or developments.",
      icon: <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          Outdated Information
        </Badge>
      ),
    },
    {
      verdict: "exaggerated",
      label: "Exaggerated Claims",
      definition: "Based on some truth, but overstates or sensationalizes the facts beyond what evidence supports.",
      icon: <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertTriangleIcon className="h-3 w-3 mr-1" />
          Exaggerated Claims
        </Badge>
      ),
    },
    {
      verdict: "opinion",
      label: "Opinion",
      definition: "Expresses subjective views or personal beliefs rather than factual claims that can be verified.",
      icon: <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          Opinion
        </Badge>
      ),
    },
    {
      verdict: "rumor",
      label: "Rumor",
      definition: "Unverified information circulating without credible sources or confirmation.",
      icon: <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />,
      badge: (
        <Badge className="bg-muted text-muted-foreground border border-border">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          Rumor
        </Badge>
      ),
    },
    {
      verdict: "conspiracy",
      label: "Conspiracy Theory",
      definition: "Claims about secret plots or hidden agendas without credible evidence to support them.",
      icon: <XCircleIcon className="h-4 w-4 text-destructive" />,
      badge: (
        <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Conspiracy Theory
        </Badge>
      ),
    },
    {
      verdict: "debunked",
      label: "Debunked",
      definition: "This claim has been thoroughly disproven by multiple credible sources and scientific evidence.",
      icon: <XCircleIcon className="h-4 w-4 text-destructive" />,
      badge: (
        <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Debunked
        </Badge>
      ),
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full mb-6">
      <AccordionItem value="glossary" className="border-2 rounded-lg px-6 !border-b-2">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-medium text-base">Understanding Verdict Types</h4>
            <Badge variant="outline" className="ml-2">
              {verdictTypes.length} types
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6 pt-2">
          <p className="text-sm text-muted-foreground mb-4">
            Our analysis uses these verdict types to classify content accuracy. Each verdict is assigned based on evidence quality and source credibility.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {verdictTypes.map((item) => (
              <div
                key={item.verdict}
                className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">{item.badge}</div>
                    <p className="text-xs text-foreground leading-relaxed">
                      {item.definition}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface FactCheckDisplayProps {
  factCheck: any;
  originTracingData?: any;
  currentData: any;
  previewMode?: boolean;
}

export function FactCheckDisplay({
  factCheck,
  originTracingData,
  currentData,
  previewMode = false,
}: FactCheckDisplayProps) {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const verdictDetailRef = useRef<HTMLDivElement>(null);

  const scrollToVerdictDetail = () => {
    verdictDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Normalize various backend verdict strings to a canonical set used by UI
  const normalizeVerdict = (status: string | undefined | null): "verified" | "false" | "misleading" | "unverified" | "satire" | "partially_true" | "outdated" | "exaggerated" | "opinion" | "rumor" | "conspiracy" | "debunked" => {
    const value = (status || "").toString().trim().toLowerCase();
    console.log("Normalizing verdict - input:", status, "-> lowercase:", value);
    
    if (value === "true" || value === "verified") return "verified";
    if (value === "false") return "false";
    if (value === "misleading") return "misleading";
    if (value === "unverified" || value === "unverifiable") return "unverified";
    if (value === "satire") return "satire";
    if (value === "partially_true" || value === "partially true") return "partially_true";
    if (value === "outdated") return "outdated";
    if (value === "exaggerated") return "exaggerated";
    if (value === "opinion") return "opinion";
    if (value === "rumor") return "rumor";
    if (value === "conspiracy") return "conspiracy";
    if (value === "debunked") return "debunked";
    
    console.log("No match found, defaulting to unverified");
    return "unverified";
  };
  
  const normalizedVerdict = normalizeVerdict(factCheck.verdict);
  console.log("Final normalized verdict:", normalizedVerdict);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircleIcon className="h-4 w-4 text-foreground" />;
      case "false":
        return <XCircleIcon className="h-4 w-4 text-destructive" />;
      case "misleading":
        return <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />;
      case "unverified":
      case "unverifiable":
        return <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />;
      case "satire":
        return <span className="text-muted-foreground text-sm">🎭</span>;
      case "partially_true":
        return <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />;
      case "outdated":
        return <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />;
      case "exaggerated":
        return <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />;
      case "opinion":
        return <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />;
      case "rumor":
        return <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />;
      case "conspiracy":
        return <XCircleIcon className="h-4 w-4 text-destructive" />;
      case "debunked":
        return <XCircleIcon className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/20">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "false":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
            <XCircleIcon className="h-3 w-3 mr-1" />
            False Information
          </Badge>
        );
      case "misleading":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Misleading Content
          </Badge>
        );
      case "unverified":
      case "unverifiable":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Insufficient Evidence
          </Badge>
        );
      case "satire":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <SmileIcon className="h-3 w-3 mr-1" />
            Satirical Content
          </Badge>
        );
      case "partially_true":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Partially True
          </Badge>
        );
      case "outdated":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Outdated Information
          </Badge>
        );
      case "exaggerated":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Exaggerated Claims
          </Badge>
        );
      case "opinion":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Opinion
          </Badge>
        );
      case "rumor":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Rumor
          </Badge>
        );
      case "conspiracy":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Conspiracy Theory
          </Badge>
        );
      case "debunked":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Debunked
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            <SearchIcon className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
    }
  };

  const getVerificationReasoning = (factCheck: FactCheckResult) => {
    // Extract the reasoning for why the AI assigned this verdict
    if (factCheck.explanation) {
      const explanation = factCheck.explanation.trim();
      
      // Look for reasoning patterns in the explanation
      const reasoningPatterns = [
        /(?:because|since|as|reasoning:|rationale:|this is (?:because|due to|since))[\s:]*([^.]+\.(?:\s+[^.]+\.)?)/i,
        /(?:the (?:evidence|sources|research) (?:shows?|indicates?|suggests?|confirms?))[\s:]*([^.]+\.(?:\s+[^.]+\.)?)/i,
        /(?:based on|according to)[\s:]*([^.]+\.(?:\s+[^.]+\.)?)/i,
      ];

      for (const pattern of reasoningPatterns) {
        const match = explanation.match(pattern);
        if (match && match[1]) {
          const reasoning = match[1].trim();
          return reasoning.length > 180 ? reasoning.substring(0, 180) + '...' : reasoning;
        }
      }

      // If no specific reasoning pattern found, extract key sentences that explain the verdict
      const sentences = explanation.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      // Look for sentences with key verdict-related words
      const keyWords = ['evidence', 'sources', 'credible', 'confirmed', 'contradicted', 'supports', 'indicates', 'shows', 'research', 'verified', 'false', 'misleading'];
      const relevantSentences = sentences.filter(s => 
        keyWords.some(word => s.toLowerCase().includes(word))
      ).slice(0, 2);

      if (relevantSentences.length > 0) {
        const reasoning = relevantSentences.join('. ').trim() + '.';
        return reasoning.length > 180 ? reasoning.substring(0, 180) + '...' : reasoning;
      }

      // Fallback: use first 1-2 sentences
      const fallback = sentences.slice(0, 2).join('. ').trim();
      return fallback.length > 180 ? fallback.substring(0, 180) + '...' : (fallback + (fallback.endsWith('.') ? '' : '.'));
    }

    return "Analysis based on available sources and evidence.";
  };

  const getVerdictDescription = (
    status: string,
    factCheck?: FactCheckResult
  ) => {
    // Extract reasoning from the analysis to explain why this verdict was chosen
    const reasoning = factCheck ? getVerificationReasoning(factCheck) : null;

    switch (status) {
      case "verified":
        return {
          title: "Content Verified",
          verdictDefinition: "Clear evidence from multiple credible sources supports the claims made in this content.",
          description:
            reasoning ||
            "Clear evidence supports the claims made in this content. Multiple credible sources confirm the accuracy of the information presented.",
        };
      case "true":
        return {
          title: "Factually Accurate",
          verdictDefinition: "Clear evidence from multiple credible sources supports the claims made in this content.",
          description:
            reasoning ||
            "The information presented is factually correct based on available evidence from reliable sources.",
        };
      case "false":
        return {
          title: "False Information",
          verdictDefinition: "The claims are factually incorrect and contradicted by credible evidence from reliable sources.",
          description:
            reasoning ||
            "The claims made in this content are factually incorrect and contradicted by credible evidence from reliable sources.",
        };
      case "misleading":
        return {
          title: "Misleading Content",
          verdictDefinition: "The content lacks important context, presents selective information, or draws unsupported conclusions.",
          description:
            reasoning ||
            "While some elements may be factually correct, the content lacks important context, presents selective information, or draws unsupported conclusions that could mislead viewers.",
        };
      case "unverifiable":
      case "unverified":
        return {
          title: "Insufficient Evidence",
          verdictDefinition: "Not enough credible evidence is available to verify or debunk the claims. Further investigation needed.",
          description:
            reasoning ||
            "There is not enough credible evidence available to verify or debunk the claims made in this content. Further investigation may be needed.",
        };
      case "satire":
        return {
          title: "Satirical Content",
          verdictDefinition: "This content is satirical, parody, or comedy in nature and should not be interpreted as factual.",
          description:
            reasoning ||
            "This content appears to be satirical, parody, or comedy in nature. It should not be interpreted as factual information.",
        };
      case "partially_true":
        return {
          title: "Partially True",
          verdictDefinition: "Contains both accurate and inaccurate elements. Some claims are supported while others are not.",
          description:
            reasoning ||
            "This content contains both accurate and inaccurate elements. Some claims are supported by evidence while others are not.",
        };
      case "outdated":
        return {
          title: "Outdated Information",
          verdictDefinition: "This information was accurate at one time but has been superseded by newer evidence or developments.",
          description:
            reasoning ||
            "This information was accurate at one time but has been superseded by newer evidence or developments.",
        };
      case "exaggerated":
        return {
          title: "Exaggerated Claims",
          verdictDefinition: "Based on some truth, but overstates or sensationalizes the facts beyond what evidence supports.",
          description:
            reasoning ||
            "While based on some truth, this content overstates or sensationalizes the facts beyond what evidence supports.",
        };
      case "opinion":
        return {
          title: "Opinion",
          verdictDefinition: "Expresses subjective views or personal beliefs rather than factual claims that can be verified.",
          description:
            reasoning ||
            "This content expresses subjective views or personal beliefs rather than factual claims that can be verified.",
        };
      case "rumor":
        return {
          title: "Rumor",
          verdictDefinition: "Unverified information circulating without credible sources or confirmation.",
          description:
            reasoning ||
            "This appears to be unverified information circulating without credible sources or confirmation.",
        };
      case "conspiracy":
        return {
          title: "Conspiracy Theory",
          verdictDefinition: "Claims about secret plots or hidden agendas without credible evidence to support them.",
          description:
            reasoning ||
            "This content involves claims about secret plots or hidden agendas without credible evidence to support them.",
        };
      case "debunked":
        return {
          title: "Debunked",
          verdictDefinition: "This claim has been thoroughly disproven by multiple credible sources and scientific evidence.",
          description:
            reasoning ||
            "This claim has been thoroughly disproven by multiple credible sources and scientific evidence.",
        };
      default:
        return {
          title: "Overall Verification Status",
          verdictDefinition: "This content is under analysis to determine its accuracy.",
          description:
            reasoning ||
            "This content is currently being analyzed. The verification process is ongoing and results will be updated when available.",
        };
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="font-medium flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5" />
        Fact-Check Analysis
      </h4>

      {/* Verdict Types Glossary */}
      <VerdictGlossary />

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verdict Overview Card */}
        <div className="md:col-span-2">
          <VerdictOverviewCard
            verdict={normalizeVerdict(factCheck.verdict)}
            confidence={factCheck.confidence}
            verdictDefinition={getVerdictDescription(factCheck.verdict, factCheck).verdictDefinition}
            reasoning={getVerdictDescription(factCheck.verdict, factCheck).description}
            icon={getStatusIcon(normalizeVerdict(factCheck.verdict))}
            badge={getStatusBadge(normalizeVerdict(factCheck.verdict))}
            onClick={scrollToVerdictDetail}
          />
        </div>

        {/* Metrics Card */}
        <MetricsOverviewCard
          confidence={factCheck.confidence}
          sourcesCount={factCheck.sources?.length || 0}
          onClick={() => setOpenModal("metrics")}
        />

        {/* Sentiment Analysis Card */}
        {factCheck.sentimentAnalysis && (() => {
          const sentiment = (factCheck.sentimentAnalysis.overall || "NEUTRAL").toUpperCase();
          const emotionalIntensity = factCheck.sentimentAnalysis.emotionalIntensity || 0;
          const scores = factCheck.sentimentAnalysis.scores || {};
          const flags = factCheck.sentimentAnalysis.flags || [];
          const manipulationTactics = factCheck.sentimentAnalysis.manipulationTactics || [];
          const credibilityImpact = factCheck.sentimentAnalysis.credibilityImpact;
          const targetEmotions = factCheck.sentimentAnalysis.targetEmotions || [];
          const linguisticRedFlags = factCheck.sentimentAnalysis.linguisticRedFlags || [];
          
          // Calculate pattern matching for the overview
          const patternMatch = calculateSentimentVerdictCorrelation(
            {
              overall: sentiment,
              scores,
              emotionalIntensity,
              manipulationTactics,
              targetEmotions,
              linguisticRedFlags,
            },
            normalizeVerdict(factCheck.verdict)
          );
          
          const getSentimentVariant = () => {
            // If high emotional intensity or manipulation detected, show as warning/danger
            if (emotionalIntensity > 0.7 || manipulationTactics.length > 0) {
              return "danger";
            }
            switch (sentiment) {
              case "POSITIVE":
                return scores.positive > 0.85 ? "warning" : "success";
              case "NEGATIVE":
                return "danger";
              case "MIXED":
                return "warning";
              default:
                return "info";
            }
          };
          const getSentimentIconColor = () => {
            if (emotionalIntensity > 0.7 || manipulationTactics.length > 0) {
              return "text-destructive";
            }
            switch (sentiment) {
              case "POSITIVE":
                return scores.positive > 0.85 ? "text-muted-foreground" : "text-primary";
              case "NEGATIVE":
                return "text-destructive";
              case "MIXED":
                return "text-muted-foreground";
              default:
                return "text-muted-foreground";
            }
          };
          
          // Find the dominant score
          const dominantScore = Math.max(
            scores.positive || 0,
            scores.negative || 0,
            scores.neutral || 0,
            scores.mixed || 0
          );
          const scorePercentage = Math.round(dominantScore * 100);
          const intensityLabel = emotionalIntensity > 0.7 ? "High" : emotionalIntensity > 0.4 ? "Moderate" : "Low";
          
          const getDescription = () => {
            // Show pattern match result if available
            if (patternMatch) {
              if (patternMatch.overallAssessment === "strong_match") {
                return `✅ ${patternMatch.confidence}% pattern match - Sentiment confirms ${factCheck.verdict} verdict`;
              } else if (patternMatch.overallAssessment === "mismatch") {
                return `🚨 ${patternMatch.confidence}% pattern match - Sentiment inconsistent with verdict`;
              } else if (patternMatch.overallAssessment === "weak_match") {
                return `⚠️ ${patternMatch.confidence}% pattern match - Some inconsistencies detected`;
              }
            }
            
            // Fallback to original logic
            // Prioritize showing manipulation tactics or credibility impact
            if (manipulationTactics.length > 0) {
              const tacticCount = manipulationTactics.length;
              const primaryTactic = manipulationTactics[0].tactic;
              return `⚠️ ${tacticCount} manipulation tactic${tacticCount > 1 ? 's' : ''} detected: ${primaryTactic}`;
            }
            
            if (credibilityImpact && credibilityImpact.modifier < 1.0) {
              const impactPercent = Math.round((1 - credibilityImpact.modifier) * 100);
              return `⚠️ Reduces credibility by ${impactPercent}% due to emotional manipulation`;
            }
            
            if (linguisticRedFlags.length >= 3) {
              return `⚠️ ${linguisticRedFlags.length} linguistic red flags detected`;
            }
            
            if (targetEmotions.length > 0) {
              const emotionList = targetEmotions.slice(0, 2).join(", ");
              return `Targets emotions: ${emotionList} • ${intensityLabel} intensity`;
            }
            
            // Default description
            const sentimentLabel = sentiment.charAt(0) + sentiment.slice(1).toLowerCase();
            const parts = [
              `${sentimentLabel} (${scorePercentage}%)`,
              `${intensityLabel} intensity`
            ];
            
            // Add flag or key phrase
            if (flags.length > 0) {
              const flagLabel = flags[0].replace(/_/g, ' ').toLowerCase();
              parts.push(flagLabel.charAt(0).toUpperCase() + flagLabel.slice(1));
            }
            
            return parts.join(' • ');
          };
          
          return (
            <SentimentOverviewCard
              title="Sentiment-Verdict Consistency"
              description={getDescription()}
              icon={<BarChart3Icon className={`h-5 w-5 ${getSentimentIconColor()}`} />}
              onClick={() => setOpenModal("sentiment")}
              variant={getSentimentVariant()}
              patternMatchConfidence={patternMatch?.confidence}
              sentimentScores={scores}
              overall={sentiment}
            />
          );
        })()}

        {/* Belief Drivers Card */}
        {((factCheck.beliefDrivers && factCheck.beliefDrivers.length > 0) || 
          (originTracingData?.beliefDrivers && originTracingData.beliefDrivers.length > 0)) && (() => {
          const drivers = originTracingData?.beliefDrivers || factCheck.beliefDrivers;
          const top3Drivers = drivers.slice(0, 3).map((driver: any) => driver.name);
          const totalCount = drivers.length;
          
          return (
            <AnalysisOverviewCard
              title="Belief Drivers"
              description={`Top psychological factors influencing belief${totalCount > 3 ? ` (${totalCount} total)` : ''}`}
              icon={<BrainIcon className="h-5 w-5 text-muted-foreground" />}
              onClick={() => setOpenModal("beliefDrivers")}
              variant="info"
              listItems={top3Drivers}
            />
          );
        })()}

        {/* Political Bias Card - For All News */}
        {(currentData.factCheck as any)?.politicalBias && (() => {
          const politicalBias = (currentData.factCheck as any).politicalBias;
          
          // Use Malaysia-specific score if available, otherwise use general bias analysis
          let biasScore: number;
          let confidence: number;
          
          if (politicalBias.isMalaysiaPolitical && politicalBias.malaysiaBiasScore !== undefined) {
            // Malaysia-specific analysis
            biasScore = politicalBias.malaysiaBiasScore;
            confidence = politicalBias.confidence || 0.7;
          } else {
            // General political bias analysis - convert biasDirection and biasIntensity to a score
            const biasDirection = politicalBias.biasDirection;
            const biasIntensity = politicalBias.biasIntensity || 0;
            confidence = politicalBias.confidence || 0.6;
            
            // Convert general bias to 0-100 score
            if (biasDirection === "left") {
              biasScore = Math.round(30 - (biasIntensity * 30)); // 0-30 range
            } else if (biasDirection === "right") {
              biasScore = Math.round(70 + (biasIntensity * 30)); // 70-100 range
            } else if (biasDirection === "center") {
              biasScore = Math.round(40 + (biasIntensity * 20)); // 40-60 range
            } else {
              biasScore = 50; // Neutral/none
            }
          }
          
          // Get bias category (same logic as PoliticalBiasMeter)
          const getBiasCategory = (score: number): {
            label: string;
            position: "left" | "center" | "right";
            color: string;
          } => {
            if (score <= 30) {
              return {
                label: "Likely leaning toward Opposition",
                position: "left",
                color: "text-blue-600 dark:text-blue-400",
              };
            } else if (score >= 70) {
              return {
                label: "Likely leaning toward Pro-Government",
                position: "right",
                color: "text-green-600 dark:text-green-400",
              };
            } else {
              return {
                label: "Appears Neutral / Mixed",
                position: "center",
                color: "text-gray-600 dark:text-gray-400",
              };
            }
          };
          
          const biasCategory = getBiasCategory(biasScore);
          
          return (
            <PoliticalBiasOverviewCard
              title="Political Bias Analysis"
              description="Analysis of political leaning in all news"
              icon={<BarChart3Icon className="h-5 w-5 text-muted-foreground" />}
              onClick={() => setOpenModal("politicalBias")}
              variant="info"
              biasScore={biasScore}
              confidence={confidence}
              biasCategory={biasCategory}
            />
          );
        })()}
      </div>

      {/* Origin Tracing Section - Full Display */}
      {(factCheck.originTracing?.hypothesizedOrigin ||
        originTracingData?.originTracing?.hypothesizedOrigin) && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h4 className="font-semibold text-lg">
              Origin Tracing & Belief Evolution
            </h4>
          </div>
          <div className="rounded-lg">
            <OriginTracingDiagram
              key={openModal ? 'modal-open' : 'modal-closed'}
              originTracing={
                originTracingData?.originTracing || factCheck.originTracing
              }
              beliefDrivers={
                originTracingData?.beliefDrivers || factCheck.beliefDrivers
              }
              sources={
                factCheck.sources?.map((source: any) => ({
                  url: source.url,
                  title: source.title,
                  source: source.title || new URL(source.url).hostname,
                  credibility: source.credibility !== undefined ? Math.round(source.credibility * 100) : undefined,
                })) ||
                (originTracingData?.sources && originTracingData?.sources.length > 0
                  ? originTracingData.sources.map((source: any) => ({
                      url: source.url,
                      title: source.title,
                      source: source.source || new URL(source.url).hostname,
                      credibility: source.credibility !== undefined ? Math.round(source.credibility * 100) : undefined,
                    }))
                  : [])
              }
              verdict={factCheck.verdict}
              content={originTracingData?.claim || factCheck.content}
              allLinks={
                originTracingData?.allLinks ||
                factCheck.sources?.map((source: any) => ({
                  url: source.url,
                  title: source.title,
                }))
              }
              previewMode={previewMode}
            />
          </div>
        </div>
      )}

      {/* Verdict Detail Section - Displayed below graph */}
      <div ref={verdictDetailRef} className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
          <h4 className="font-semibold text-lg">
            Verification Status Details
          </h4>
        </div>
        <Card className="border-2">
          <CardContent className="p-6">
            <VerdictDetailContent
              verdict={normalizeVerdict(factCheck.verdict)}
              confidence={factCheck.confidence}
              verdictDefinition={getVerdictDescription(factCheck.verdict, factCheck).verdictDefinition}
              description={getVerdictDescription(factCheck.verdict, factCheck).description}
              explanation={factCheck.explanation}
              statusIcon={getStatusIcon(normalizeVerdict(factCheck.verdict))}
              statusBadge={getStatusBadge(normalizeVerdict(factCheck.verdict))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sources Card - Full Display */}
      {factCheck.sources && factCheck.sources.length > 0 && (
        <div className="mt-6">
          <Accordion type="single" collapsible defaultValue="sources" className="w-full">
            <AccordionItem value="sources" className="border-2 rounded-lg px-6 !border-b-2">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h4 className="font-semibold text-lg">
                    Sources & Evidence
                  </h4>
                  <Badge variant="secondary" className="ml-2">
                    {factCheck.sources.length} {factCheck.sources.length === 1 ? 'source' : 'sources'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <SourcesDetailContent sources={factCheck.sources} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Detail Modals */}
      <AnalysisDetailModal
        isOpen={openModal === "metrics"}
        onClose={() => setOpenModal(null)}
        title="Analysis Metrics"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Confidence Level
              </h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">
                  {factCheck.confidence}%
                </span>
              </div>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${factCheck.confidence}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on source credibility and evidence strength
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Sources Analyzed
              </h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {factCheck.sources?.length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Credible sources verified for accuracy
              </p>
            </div>
          </div>
        </div>
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "sources"}
        onClose={() => setOpenModal(null)}
        title="Sources & Evidence"
      >
        {factCheck.sources && factCheck.sources.length > 0 && (
          <SourcesDetailContent sources={factCheck.sources} />
        )}
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "beliefDrivers"}
        onClose={() => setOpenModal(null)}
        title="Why People Believe This"
      >
        {((factCheck.beliefDrivers && factCheck.beliefDrivers.length > 0) || 
          (originTracingData?.beliefDrivers && originTracingData.beliefDrivers.length > 0)) && (
          <BeliefDriversDetailContent 
            beliefDrivers={originTracingData?.beliefDrivers || factCheck.beliefDrivers} 
          />
        )}
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "sentiment"}
        onClose={() => setOpenModal(null)}
        title="Sentiment Analysis"
      >
        {factCheck.sentimentAnalysis && (
          <SentimentDisplay 
            sentiment={factCheck.sentimentAnalysis} 
            verdict={factCheck.verdict}
          />
        )}
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "politicalBias"}
        onClose={() => setOpenModal(null)}
        title="Political Bias Analysis"
      >
        {(currentData.factCheck as any)?.politicalBias && (() => {
          const politicalBias = (currentData.factCheck as any).politicalBias;
          
          // Use Malaysia-specific score if available, otherwise use general bias analysis
          let biasScore: number;
          let explanation: string;
          let keyQuote: string;
          let confidence: number;
          let biasIndicators: string[];
          let politicalTopics: string[];
          
          if (politicalBias.isMalaysiaPolitical && politicalBias.malaysiaBiasScore !== undefined) {
            // Malaysia-specific analysis
            biasScore = politicalBias.malaysiaBiasScore;
            explanation = politicalBias.explanation || "Malaysia political bias analysis completed.";
            keyQuote = politicalBias.keyQuote || "";
            confidence = politicalBias.confidence || 0.7;
            biasIndicators = politicalBias.biasIndicators || [];
            politicalTopics = politicalBias.politicalTopics || [];
          } else {
            // General political bias analysis - convert biasDirection and biasIntensity to a score
            const biasDirection = politicalBias.biasDirection;
            const biasIntensity = politicalBias.biasIntensity || 0;
            confidence = politicalBias.confidence || 0.6;
            biasIndicators = politicalBias.biasIndicators || [];
            politicalTopics = politicalBias.politicalTopics || [];
            
            // Convert general bias to 0-100 score
            if (biasDirection === "left") {
              biasScore = Math.round(30 - (biasIntensity * 30)); // 0-30 range
            } else if (biasDirection === "right") {
              biasScore = Math.round(70 + (biasIntensity * 30)); // 70-100 range
            } else if (biasDirection === "center") {
              biasScore = Math.round(40 + (biasIntensity * 20)); // 40-60 range
            } else {
              biasScore = 50; // Neutral/none
            }
            
            // Generate explanation for general political bias
            explanation = politicalBias.explanation || `General political bias analysis shows ${biasDirection} leaning with ${Math.round(biasIntensity * 100)}% intensity.`;
            keyQuote = "";
          }
          
          return (
            <PoliticalBiasMeter
              biasScore={biasScore}
              explanation={explanation}
              keyQuote={keyQuote}
              confidence={confidence}
              biasIndicators={biasIndicators}
              politicalTopics={politicalTopics}
            />
          );
        })()}
      </AnalysisDetailModal>
    </div>
  );
}
