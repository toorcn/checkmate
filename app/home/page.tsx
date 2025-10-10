import { LandingContent } from "@/components/home/landing-content";

export const metadata = {
  title: "Checkmate - AI-Powered Misinformation Detection & Fact-Checking",
  description: "Combating digital misinformation in Malaysia through advanced AI, NLP, and crowd-sourced verification. Analyze content from TikTok, Twitter, and web articles with real-time fact-checking.",
  keywords: ["fact-checking", "misinformation", "AI", "Malaysia", "verification", "TikTok", "Twitter", "content analysis"],
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <LandingContent />
    </main>
  );
}

