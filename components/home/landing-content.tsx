import { LandingHero } from "./landing-hero";
import { FeaturesGrid } from "./features-grid";
import { DashboardShowcase } from "./dashboard-showcase";

export function LandingContent() {
  return (
    <div className="relative">
      <LandingHero />
      <DashboardShowcase />
      <FeaturesGrid />
      
      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to Combat Misinformation?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join thousands of users fighting digital misinformation with AI-powered fact-checking
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
              >
                Start Analyzing Content
              </a>
              <a
                href="/api/external"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
              >
                Explore API
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

