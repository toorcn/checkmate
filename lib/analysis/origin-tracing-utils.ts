/**
 * Origin Tracing Utilities
 * 
 * Helper functions for formatting and extracting content from origin tracing data
 */

import React, { ReactElement } from 'react';
import { parseMarkdownToText, parseMarkdownToJSX } from './markdown-parser';
import { OriginTracingData, BeliefDriver, FactCheckSource } from '../../types/origin-tracing';

/**
 * Format text content for node display (removes markdown for plain text)
 */
export function formatNodeText(text: string | undefined, maxLength: number = 200): string {
  if (!text || typeof text !== 'string') return '';
  
  // Parse markdown to plain text
  const cleanText = parseMarkdownToText(text);
  
  // Handle line breaks and normalize whitespace
  const normalizedText = cleanText
    .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
  
  // Truncate if too long
  if (normalizedText.length > maxLength) {
    return normalizedText.substring(0, maxLength).trim() + '...';
  }
  
  return normalizedText;
}

/**
 * Format multiline text with markdown rendering
 */
export function formatMultilineText(text: string | undefined, maxLines: number = 3): ReactElement {
  if (!text || typeof text !== 'string') return React.createElement(React.Fragment, null);
  
  // Parse markdown to JSX elements
  const elements = parseMarkdownToJSX(text);
  
  // Limit the number of elements displayed
  const limitedElements = elements.slice(0, maxLines);
  
  return React.createElement(
    'div',
    { className: 'space-y-1' },
    limitedElements.map((element, index) =>
      React.createElement('div', { key: index }, element)
    ),
    elements.length > maxLines &&
      React.createElement('div', { className: 'text-xs text-gray-500 italic' }, '...')
  );
}

/**
 * Extract meaningful claim content from various data sources
 */
export function extractClaimContent(
  content?: string,
  originTracing?: OriginTracingData,
  beliefDrivers?: BeliefDriver[],
  sources?: FactCheckSource[]
): string {
  // Try to extract from provided content first
  if (content && content.trim()) {
    // If it's a long analysis, try to find the main claim
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Look for claim-like statements (usually shorter, declarative sentences)
    const claimCandidates = lines.filter(line => 
      line.length > 10 && 
      line.length < 200 && 
      !line.startsWith('#') && 
      !line.startsWith('*') && 
      !line.includes('analysis') &&
      !line.includes('conclusion') &&
      !line.toLowerCase().includes('however') &&
      !line.toLowerCase().includes('according to')
    );
    
    if (claimCandidates.length > 0) {
      return claimCandidates[0];
    }
    
    // Fallback to first meaningful line
    const firstMeaningfulLine = lines.find(line => 
      line.length > 15 && 
      !line.startsWith('#') && 
      !line.startsWith('**')
    );
    
    if (firstMeaningfulLine) {
      return firstMeaningfulLine.length > 150 
        ? firstMeaningfulLine.substring(0, 150) + '...'
        : firstMeaningfulLine;
    }
  }
  
  // Try to extract from origin tracing
  if (originTracing?.hypothesizedOrigin) {
    return originTracing.hypothesizedOrigin.length > 150
      ? originTracing.hypothesizedOrigin.substring(0, 150) + '...'
      : originTracing.hypothesizedOrigin;
  }
  
  // Try to extract from belief drivers descriptions
  if (beliefDrivers && beliefDrivers.length > 0) {
    const firstDriver = beliefDrivers[0];
    if (firstDriver.description) {
      const desc = firstDriver.description;
      return desc.length > 150 
        ? desc.substring(0, 150) + '...'
        : desc;
    }
  }
  
  // Try to extract from sources
  if (sources && sources.length > 0) {
    return `Claim being fact-checked by ${sources.length} source${sources.length > 1 ? 's' : ''}`;
  }
  
  return 'Current Claim Under Analysis';
}

