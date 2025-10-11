import { PageLayout } from "@/components/ui/page-layout";
import DashboardHome from "@/components/home/DashboardHome";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const linkParam = typeof params.link === "string" ? params.link : "";

  return (
    <PageLayout variant="gradient">
      <DashboardHome initialUrl={linkParam} />
    </PageLayout>
  );
}
