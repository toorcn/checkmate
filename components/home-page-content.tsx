import { HeroSection } from "@/components/hero-section";

interface HomePageContentProps {
  initialUrl?: string;
}

export function HomePageContent({ initialUrl = "" }: HomePageContentProps) {
  return (
    <>
      <HeroSection initialUrl={initialUrl} />
    </>
  );
}
