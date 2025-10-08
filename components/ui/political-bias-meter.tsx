"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export interface PoliticalBiasMeterProps {
  /** Bias score from 0-100 (0-30: Opposition, 31-69: Neutral, 70-100: Pro-Government) */
  biasScore: number;
  /** Explanation of the bias analysis (2-3 lines) */
  explanation: string;
  /** Key quote that contributed to the bias assessment */
  keyQuote?: string;
  /** Confidence level (0-1) */
  confidence?: number;
  /** Additional bias indicators */
  biasIndicators?: string[];
  /** Political topics detected */
  politicalTopics?: string[];
  /** CSS class name for styling */
  className?: string;
}

/**
 * Political Bias Meter Component
 * 
 * Displays a horizontal awareness meter for Malaysia political content bias.
 * Shows the bias position without revealing the raw score to users.
 * 
 * Scoring Guide:
 * - 0-30: Opposition-leaning (content frames government negatively, praises opposition)
 * - 31-69: Neutral/Mixed (balanced tone, no clear alignment)
 * - 70-100: Pro-Government (frames government positively, portrays opposition negatively)
 * 
 * @example
 * ```tsx
 * <PoliticalBiasMeter
 *   biasScore={75}
 *   explanation="The article consistently praises government initiatives..."
 *   keyQuote="The opposition parties once again blocked a policy..."
 *   confidence={0.85}
 * />
 * ```
 */
export function PoliticalBiasMeter({
  biasScore,
  explanation,
  keyQuote,
  confidence,
  biasIndicators,
  politicalTopics,
  className = "",
}: PoliticalBiasMeterProps) {
  // Determine bias category and label
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
  
  // Calculate dot position (0-100 maps to 0%-100% of the meter width)
  const dotPosition = `${biasScore}%`;

  return (
    <Card className={`border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          Political Bias Awareness Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Awareness Notice */}
        <div className="text-sm text-amber-800 dark:text-amber-200 font-semibold mb-1">
          Political framing analysis
        </div>

        {/* Horizontal Meter with Gradient */}
        <div className="relative w-full mb-4">
          {/* Meter Background with Color Gradient */}
          <div className="h-2.5 bg-gradient-to-r from-red-400 via-yellow-300 to-green-400 dark:from-red-600 dark:via-yellow-500 dark:to-green-500 rounded-full shadow-inner" />
          
          {/* Position Indicator Dot with Confidence Glow */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
            style={{ left: dotPosition }}
          >
            {/* Confidence glow */}
            {confidence && confidence >= 0.7 && (
              <div className="absolute inset-0 w-6 h-6 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-amber-400/30 dark:bg-amber-300/20 rounded-full blur-md animate-pulse" />
            )}
            {/* Main dot */}
            <div className="relative w-5 h-5 bg-amber-600 dark:bg-amber-400 rounded-full border-3 border-white dark:border-gray-900 shadow-lg" />
          </div>
          
          {/* End Labels */}
          <div className="flex justify-between text-xs font-medium mt-3 px-1">
            <div className="text-red-600 dark:text-red-400">
              Opposition-leaning
            </div>
            <div className="text-yellow-600 dark:text-yellow-400">
              Neutral
            </div>
            <div className="text-green-600 dark:text-green-400">
              Pro-government
            </div>
          </div>
        </div>

        {/* Bias Assessment - Single Hero Insight */}
        <div className={`text-sm font-semibold ${biasCategory.color} mb-3 px-1`}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-2" />
          {biasScore <= 30 
            ? "Opposition-leaning framing: "
            : biasScore >= 70
            ? "Pro-government framing: "
            : "Why is it Neutral: "}
          <span className="font-normal">{explanation.split('.')[0]}.</span>
        </div>

        {/* Details Section */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800 space-y-4">
          
          {/* Key Quote - Visual, no label */}
          {keyQuote && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border-l-3 border-amber-500">
              <p className="text-sm italic text-foreground leading-relaxed mb-1">
                &ldquo;{keyQuote}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Key phrase contributing to classification
              </p>
            </div>
          )}

          {/* Framing Patterns - Natural Language */}
          {((politicalTopics && politicalTopics.length > 0) || (biasIndicators && biasIndicators.length > 0)) && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                Framing Patterns Detected
              </p>
              
              {/* Convert topics to natural insights */}
              <div className="space-y-1.5">
                {politicalTopics?.slice(0, 5).map((topic, idx) => {
                  // Convert AI tokens to natural language
                  const getNaturalPhrase = (t: string) => {
                    const lower = t.toLowerCase();
                    if (lower.includes('leadership')) return 'Leadership credibility emphasized';
                    if (lower.includes('international')) return 'Focuses on global reputation';
                    if (lower.includes('credibility')) return 'Government credibility highlighted';
                    if (lower.includes('criticism')) return 'Critical tone toward subject';
                    if (lower.includes('opposition')) return 'Opposition perspectives absent';
                    if (lower.includes('government')) return 'Government actions portrayed positively';
                    if (lower.includes('sarcasm')) return 'Sarcastic or rhetorical language used';
                    if (lower.includes('questioning')) return 'Questions legitimacy of actions';
                    return t; // Fallback to original
                  };
                  
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                      <span>{getNaturalPhrase(topic)}</span>
                    </div>
                  );
                })}
                
                {/* Add bias indicators as natural phrases */}
                {biasIndicators?.slice(0, 3).map((indicator, idx) => (
                  <div key={`ind-${idx}`} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Warning */}
          {confidence !== undefined && confidence < 0.6 && (
            <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Note: This assessment has lower confidence ({Math.round(confidence * 100)}%). 
                Manual review recommended.
              </p>
            </div>
          )}
        </div>

        {/* Neutrality Disclaimer - Clean */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed">
            <span className="font-semibold">Note:</span> This analysis identifies framing patterns in political language. 
            It does not verify factual accuracy or endorse any viewpoint. Use this as one of many tools for media literacy.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
