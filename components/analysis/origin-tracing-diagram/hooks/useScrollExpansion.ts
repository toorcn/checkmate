/**
 * useScrollExpansion Hook
 * 
 * Detects when the diagram container enters the viewport during scroll
 * and expands its width with a smooth animation
 */

import { useEffect, useState, RefObject } from 'react';

interface UseScrollExpansionProps {
  containerRef: RefObject<HTMLElement | HTMLDivElement | null>;
  /** Percentage to expand width by (e.g., 10 means 10% wider) */
  expansionPercentage?: number;
  /** Duration in milliseconds for the expansion animation (not used in hook, applied via CSS) */
  _duration?: number;
}

interface ScrollExpansionState {
  /** Current width scale factor (1.0 = normal, 1.1 = 10% wider) */
  widthScale: number;
  /** Whether the element is currently in expanded state */
  isExpanded: boolean;
}

export function useScrollExpansion({
  containerRef,
  expansionPercentage = 15,
  _duration = 600,
}: UseScrollExpansionProps): ScrollExpansionState {
  const [widthScale, setWidthScale] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    // Calculate the expansion scale
    const maxScale = 1 + expansionPercentage / 100;
    
    // IntersectionObserver to detect when element enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Element is entering or in viewport
          if (entry.isIntersecting) {
            // Check if element is significantly visible (>30% visible)
            if (entry.intersectionRatio > 0.3) {
              setIsExpanded(true);
              setWidthScale(maxScale);
            }
          } else {
            // Element has left viewport
            setIsExpanded(false);
            setWidthScale(1.0);
          }
        });
      },
      {
        // Trigger when 30% of the element is visible
        threshold: [0, 0.3, 0.5, 0.7, 1.0],
        // Add some margin to trigger slightly before/after exact viewport edges
        rootMargin: '0px 0px -10% 0px',
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [containerRef, expansionPercentage]);
  
  return {
    widthScale,
    isExpanded,
  };
}

