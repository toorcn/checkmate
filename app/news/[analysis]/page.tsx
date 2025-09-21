import { AnalysisPage } from "@/components/analyses-content";

export default async function AnalysisPageWrapper({
  params,
}: {
  params: Promise<{ analysis: string }>;
}) {
  const { analysis } = await params;
  return <AnalysisPage analysisId={analysis} />;
}
