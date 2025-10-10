'use client';

import { Button } from "@/components/ui/button";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dotted Surface Background */}
      <DottedSurface className="absolute inset-0" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs sm:text-sm text-muted-foreground">New: External API & Dashboard updates</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
            Voice of Truth at the speed of thought
          </h1>
          {/* Subheadline */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Leverage ultra AI analysis and scalable APIs for real-time
            misinformation detection. 
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild size="sm" className="h-10 px-5 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={scrollToFeatures} className="h-10 px-5 border-border/60 bg-transparent hover:bg-muted/50">
              Explore docs
            </Button>
          </div>

          {/* Floating demo card */}
          <div className="relative mx-auto mt-12 w-full max-w-4xl">
            <div className="rounded-xl border border-border/70 bg-background/60 p-5 text-left shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Welcome to Checkmate — your truth companion.</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                  Jane
                  <span className="relative inline-flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-80" />
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-full border-border/60 bg-transparent hover:bg-muted/50" asChild>
                  <Link href="/">
                    Analyze content
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-border/60 bg-transparent hover:bg-muted/50" asChild>
                  <Link href="/api/external">
                    Explore API
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-border/60 bg-transparent hover:bg-muted/50" asChild>
                  <Link href="/news">
                    View dashboard
                  </Link>
                </Button>
                <button aria-label="Play" className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-background hover:bg-muted/50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Sponsors strip */}
          <div className="mx-auto mt-14 w-full max-w-5xl border-t border-border/60 pt-8">
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <div className="opacity-80">x.com</div>
              <div className="opacity-80">tiktok</div>
              <div className="opacity-80">web</div>
              <div className="opacity-80">api</div>
              <div className="opacity-80">mobile</div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

