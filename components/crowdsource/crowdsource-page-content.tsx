/**
 * CrowdsourcePageContent - Client component for crowdsource page
 */

"use client";

import { useLanguage } from "@/components/global-translation-provider";
import { CrowdsourceLayout } from "./crowdsource-layout";

/**
 * Props for the CrowdsourcePageContent component
 */
interface CrowdsourcePageContentProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * CrowdsourcePageContent component handles the crowdsource page layout and functionality
 */
export const CrowdsourcePageContent = ({
  className,
}: CrowdsourcePageContentProps) => {
  const { t } = useLanguage();

  return (
    <CrowdsourceLayout title={t.crowdsourceNews} className={className} />
  );
};
