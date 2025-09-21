import { useEffect, useState, useCallback } from "react";

interface UseAnimatedProgressOptions {
  duration?: number; // Duration in milliseconds, default 10000 (10 seconds)
  easingFunction?: (t: number) => number; // Custom easing function
  autoStart?: boolean; // Whether to start automatically, default false
}

/**
 * Custom hook for animated progress with easing curve
 * Provides fast-to-slow progression over specified duration
 */
export function useAnimatedProgress({
  duration = 10000,
  easingFunction,
  autoStart = false,
}: UseAnimatedProgressOptions = {}) {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationId, setAnimationId] = useState<number | null>(null);

  // Fast-to-slow easing function (ease-out cubic)
  const defaultEasing = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  const easing = easingFunction || defaultEasing;

  const startProgress = useCallback(() => {
    if (isAnimating) return;
    
    setProgress(0);
    setIsAnimating(true);
    
    const startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = easing(linearProgress);
      
      // Convert to percentage (0-100) but cap at 98% to avoid showing "complete"
      const progressValue = Math.min(easedProgress * 98, 98);
      
      setProgress(progressValue);
      
      if (linearProgress < 1) {
        const id = requestAnimationFrame(animate);
        setAnimationId(id);
      } else {
        setIsAnimating(false);
        setAnimationId(null);
      }
    };
    
    const id = requestAnimationFrame(animate);
    setAnimationId(id);
  }, [duration, easing, isAnimating]);

  const stopProgress = useCallback(() => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
    setIsAnimating(false);
  }, [animationId]);

  const resetProgress = useCallback(() => {
    stopProgress();
    setProgress(0);
  }, [stopProgress]);

  // Auto-start if specified
  useEffect(() => {
    if (autoStart) {
      startProgress();
    }
    
    // Cleanup on unmount
    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [autoStart, startProgress, animationId]);

  return {
    progress,
    isAnimating,
    startProgress,
    stopProgress,
    resetProgress,
  };
}
