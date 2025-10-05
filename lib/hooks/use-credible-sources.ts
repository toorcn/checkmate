import { useEffect, useState } from "react";

export const useCredibleSources = (platform?: string, limit: number = 5) => {
  const [data, setData] = useState<any[] | undefined>(undefined);
  useEffect(() => {
    const qs = platform ? `?platform=${encodeURIComponent(platform)}&limit=${limit}` : `?limit=${limit}`;
    fetch(`/api/creators/top${qs}`).then(r=>r.json()).then(setData).catch(()=>setData([]));
  }, [platform, limit]);
  return data;
};

export const useMisinformationSources = (
  platform?: string,
  limit: number = 5
) => {
  const [data, setData] = useState<any[] | undefined>(undefined);
  useEffect(() => {
    const qs = platform ? `?platform=${encodeURIComponent(platform)}&limit=${limit}` : `?limit=${limit}`;
    fetch(`/api/creators/bottom${qs}`).then(r=>r.json()).then(setData).catch(()=>setData([]));
  }, [platform, limit]);
  return data;
};
