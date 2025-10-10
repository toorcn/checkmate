/**
 * useScrollExpansion Hook
 * 
 * Detects when the diagram container scrolls into view and triggers expansion
 */

import { useState, useEffect, RefObject } from 'react';
import { useDiagramExpansion } from '@/lib/hooks/useDiagramExpansion';

export function useScrollExpansion(containerRef: RefObject<HTMLDivElement | null>, previewMode: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setIsExpanded: setGlobalExpanded } = useDiagramExpansion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // In preview mode, never expand
    if (previewMode) {
      setIsExpanded(false);
      setGlobalExpanded(false);
      return;
    }

    // Create intersection observer to detect when diagram enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const shouldExpand = entry.isIntersecting;
          setIsExpanded(shouldExpand);
          setGlobalExpanded(shouldExpand);
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of diagram is visible
        rootMargin: '0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      setGlobalExpanded(false);
    };
  }, [containerRef, setGlobalExpanded, previewMode]);

  return { isExpanded };
}

