'use client';

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { 
  Target, 
  Brain, 
  CheckCircle2, 
  Users, 
  Code2, 
  Globe 
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    Icon: Target,
    name: "Multi-Platform Analysis",
    description: "Analyze content from TikTok, Twitter, web articles, and direct media uploads with intelligent platform detection.",
    href: "/",
    cta: "Try It Now",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-0 bg-primary/10" />
    ),
  },
  {
    Icon: Brain,
    name: "AI Detection",
    description: "Advanced sentiment analysis, claim extraction, and pattern recognition to spot misinformation tactics.",
    href: "/",
    cta: "Learn More",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-accent/10" />
    ),
  },
  {
    Icon: CheckCircle2,
    name: "Automated Fact-Checking",
    description: "Real-time verification with credible sources, confidence scoring, and comprehensive evidence compilation.",
    href: "/",
    cta: "Explore",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-chart-3/10" />
    ),
  },
  {
    Icon: Users,
    name: "Creator Credibility",
    description: "Historical accuracy tracking, community feedback, and cross-platform credibility scoring for content creators.",
    href: "/",
    cta: "View Profile",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-chart-2/10" />
    ),
  },
  {
    Icon: Code2,
    name: "Developer API",
    description: "Comprehensive REST API for programmatic access to transcription, analysis, and fact-checking services. Rate-limited tiers available.",
    href: "/api/external",
    cta: "API Docs",
    className: "col-span-3 lg:col-span-1 border-2 border-primary/50",
    background: (
      <div className="absolute inset-0 bg-primary/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
    ),
  },
  {
    Icon: Globe,
    name: "Multilingual Support",
    description: "Support for English, Bahasa Malaysia, and regional languages with real-time translation capabilities.",
    href: "/",
    cta: "Languages",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-chart-4/10" />
    ),
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Powerful Features for
              <span className="text-primary"> Truth Verification</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive AI-powered tools to detect, verify, and combat misinformation across all digital platforms
            </p>
          </div>

          {/* Bento Grid */}
          <BentoGrid className="max-w-6xl mx-auto lg:grid-cols-3">
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>

          {/* Additional Info */}
          <div className="pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              All features powered by AWS Bedrock (Claude 3.5 Sonnet), OpenAI Whisper, and advanced NLP algorithms
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

