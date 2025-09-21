import { useState, useMemo, useEffect } from "react";

// Hook to get all TikTok analyses from all users with client-side pagination
export function useAllAnalyses() {
  const [displayCount, setDisplayCount] = useState(10);
  const [allAnalyses, setAllAnalyses] = useState<any[] | undefined>(undefined);
  useEffect(() => {
    fetch('/api/analyses/all?limit=200').then(r=>r.json()).then(setAllAnalyses).catch(()=>setAllAnalyses([]));
  }, []);

  const displayedAnalyses = useMemo(() => {
    if (!allAnalyses) return [];
    return allAnalyses.slice(0, displayCount);
  }, [allAnalyses, displayCount]);

  const hasMore = useMemo(() => {
    if (!allAnalyses) return false;
    return displayCount < allAnalyses.length;
  }, [allAnalyses, displayCount]);

  const loadMore = () => {
    setDisplayCount((prev) => prev + 10);
  };

  return {
    analyses: displayedAnalyses,
    isLoading: allAnalyses === undefined,
    hasMore,
    isLoadingMore: false,
    loadMore,
  };
}

// Hook to get analysis statistics from all users
export function useAllAnalysisStats() {
  const [stats, setStats] = useState<any | undefined>(undefined);
  useEffect(() => {
    fetch('/api/analyses/stats').then(r=>r.json()).then(setStats).catch(()=>setStats(undefined));
  }, []);
  return stats;
}
