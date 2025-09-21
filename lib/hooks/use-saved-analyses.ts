import { useEffect, useState, useCallback } from 'react';

export function useUserTikTokAnalyses() {
  const [data, setData] = useState<any[] | undefined>(undefined);
  useEffect(() => {
    fetch('/api/analyses').then(r => r.json()).then(setData).catch(() => setData([]));
  }, []);
  return data;
}

export function useTikTokAnalysisById(analysisId: string | undefined) {
  const [data, setData] = useState<any | undefined>(undefined);
  useEffect(() => {
    if (!analysisId) { setData(undefined); return; }
    fetch(`/api/analyses/${analysisId}`).then(r => r.json()).then(setData).catch(() => setData(null));
  }, [analysisId]);
  return data;
}

export function useAnalysesRequiringFactCheck(limit?: number) {
  const [data, setData] = useState<any[] | undefined>(undefined);
  useEffect(() => {
    const qs = limit ? `?limit=${limit}` : '';
    fetch(`/api/analyses/requires-fact-check${qs}`).then(r => r.json()).then(setData).catch(() => setData([]));
  }, [limit]);
  return data;
}

export function useUserAnalysisStats() {
  // Placeholder: no dedicated endpoint; compute client-side when needed
  return undefined as any;
}

export function useDeleteTikTokAnalysis() {
  return useCallback(async ({ analysisId }: { analysisId: string }) => {
    const res = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  }, []);
}

export function useSaveTikTokAnalysis() {
  return useCallback(async (body: any) => {
    const res = await fetch(`/api/analyses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Failed to save');
    return res.json();
  }, []);
}

export function useSaveTikTokAnalysisWithCredibility() {
  // Same endpoint, just includes creatorCredibilityRating in body
  return useSaveTikTokAnalysis();
}

export function useContentCreator(creatorId: string, platform: string) {
  const [data, setData] = useState<any | undefined>(undefined);
  useEffect(() => {
    if (!creatorId || !platform) { setData(null); return; }
    fetch(`/api/creators/${encodeURIComponent(platform)}/${encodeURIComponent(creatorId)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [creatorId, platform]);
  return data;
}

export function useTopCreatorsByCredibility(platform?: string, limit?: number) {
  const [data, setData] = useState<any[] | undefined>(undefined);
  useEffect(() => {
    const p = platform ? `platform=${encodeURIComponent(platform)}` : '';
    const l = limit ? `limit=${limit}` : '';
    const qs = p || l ? `?${[p, l].filter(Boolean).join('&')}` : '';
    fetch(`/api/creators/top${qs}`).then(r => r.json()).then(setData).catch(() => setData([]));
  }, [platform, limit]);
  return data;
}
