'use client';

import React, { useEffect, useRef, RefObject } from 'react';

interface SplitViewResizerProps {
  containerRef: RefObject<HTMLDivElement | null>;
  sidebarWidth: number;
  onSidebarWidthChange: (width: number) => void;
}

export function SplitViewResizer({
  containerRef,
  onSidebarWidthChange,
}: SplitViewResizerProps) {
  const isResizingRef = useRef(false);
  
  const handleMouseDown = () => {
    isResizingRef.current = true;
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
      const clampedWidth = Math.max(40, Math.min(50, newWidth)); // Between 40% and 50%
      onSidebarWidthChange(clampedWidth);
    };
    
    const handleMouseUp = () => {
      isResizingRef.current = false;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, onSidebarWidthChange]);
  
  return (
    <div 
      className="split-view-resizer"
      onMouseDown={handleMouseDown}
    />
  );
}

