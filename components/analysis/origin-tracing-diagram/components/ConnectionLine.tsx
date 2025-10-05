'use client';

import React from 'react';
import { getSectionColor } from '../utils/navigationUtils';

interface ConnectionLineProps {
  sectionId: string;
  isActive: boolean;
  isHovered: boolean;
  fromY: number;
  toY: number;
  containerWidth: number;
}

export const ConnectionLine = React.memo(({ 
  sectionId, 
  isActive, 
  isHovered,
  fromY,
  toY,
  containerWidth 
}: ConnectionLineProps) => {
  const color = getSectionColor(sectionId);
  const opacity = isActive || isHovered ? 0.6 : 0.2;
  
  // Calculate curved path
  const startX = containerWidth * 0.5;
  const startY = fromY;
  const endX = 10;
  const endY = toY;
  
  const controlPointOffset = Math.abs(endY - startY) * 0.3;
  const cp1X = startX;
  const cp1Y = startY + controlPointOffset;
  const cp2X = endX;
  const cp2Y = endY - controlPointOffset;

  const path = `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'visible'
      }}
    >
      <defs>
        <linearGradient id={`gradient-${sectionId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.5} />
        </linearGradient>
        <filter id={`glow-${sectionId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#gradient-${sectionId})`}
        strokeWidth={isActive || isHovered ? 3 : 2}
        strokeDasharray="5,5"
        className="transition-all duration-300 connection-line-animated"
        filter={isActive || isHovered ? `url(#glow-${sectionId})` : undefined}
        style={{
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />
    </svg>
  );
});

ConnectionLine.displayName = 'ConnectionLine';


