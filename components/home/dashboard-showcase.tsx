'use client';

import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

export function DashboardShowcase() {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <ContainerScroll
        titleComponent={
          <div className="space-y-6 pb-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Comprehensive
              <span className="text-primary"> Fact-Check Dashboard</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Get detailed analysis results with credibility scores, fact-check breakdowns, source verification, and creator profiles—all in one intuitive interface.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1" />
                <span className="text-sm text-muted-foreground">Credibility Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2" />
                <span className="text-sm text-muted-foreground">Fact Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <span className="text-sm text-muted-foreground">Source Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-4" />
                <span className="text-sm text-muted-foreground">Creator Profile</span>
              </div>
            </div>
          </div>
        }
      >
        <Image
          src="/readme/assests/sc-3.png"
          alt="Fact-Check Dashboard - Comprehensive analysis results with credibility scoring"
          width={1400}
          height={900}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
          priority
        />
      </ContainerScroll>
    </section>
  );
}

