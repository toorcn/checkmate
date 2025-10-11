"use client";

import { HeroSection } from "@/components/hero-section";
import localFont from "next/font/local";
import { GradientTracing } from "@/components/ui/gradient-tracing";

const departureMono = localFont({ src: "../DepartureMono-Regular.woff2" });

interface DashboardHomeProps {
  initialUrl?: string;
}

export default function DashboardHome({ initialUrl = "" }: DashboardHomeProps) {
  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-12 opacity-40">
        <div className="mx-auto max-w-5xl flex justify-center">
          {(() => {
            const size = 520;
            const r = 220;
            const cx = size / 2;
            const cy = size / 2;
            const circlePath = `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 ${-r * 2},0`;
            return (
              <GradientTracing width={size} height={size} path={circlePath} />
            );
          })()}
        </div>
      </div>
      <div className="relative w-full max-w-4xl px-4 md:px-6">
        <div className="text-center mb-6 md:mb-8">
          <h1 className={`text-3xl md:text-5xl font-semibold tracking-tight mb-2 ${departureMono.className}`}>
            What would you like to fact‑check?
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Paste a link or ask a question—Checkmate will analyze, verify, and trace sources.
          </p>
        </div>

        {/* Reuse existing functionality and results via HeroSection */}
        <HeroSection initialUrl={initialUrl} variant="dashboard" />
      </div>
    </div>
  );
}


