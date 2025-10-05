/**
 * Markdown Parser Utilities
 * 
 * Functions to parse markdown text to plain text or JSX elements
 */

import React, { ReactNode } from 'react';

/**
 * Parse simple markdown to plain text (removes all markdown formatting)
 */
export function parseMarkdownToText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers but keep the text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/\*([^*]+)\*/g, '$1') // *italic*
    .replace(/__([^_]+)__/g, '$1') // __bold__
    .replace(/_([^_]+)_/g, '$1') // _italic_
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Parse markdown and render as JSX elements
 */
export function parseMarkdownToJSX(text: string): ReactNode[] {
  if (!text || typeof text !== 'string') return [];
  
  const elements: ReactNode[] = [];
  
  // Split text by lines to handle different markdown elements
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    if (!line.trim()) return;
    
    // Process inline markdown elements
    const processInlineMarkdown = (text: string): ReactNode[] => {
      const parts: ReactNode[] = [];
      let remaining = text;
      let partIndex = 0;
      
      // Process bold text **text**
      remaining = remaining.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
        parts.push(<strong key={`bold-${partIndex++}`}>{content}</strong>);
        return `__BOLD_${parts.length - 1}__`;
      });
      
      // Process italic text *text*
      remaining = remaining.replace(/\*([^*]+)\*/g, (match, content) => {
        parts.push(<em key={`italic-${partIndex++}`}>{content}</em>);
        return `__ITALIC_${parts.length - 1}__`;
      });
      
      // Process inline code `code`
      remaining = remaining.replace(/`([^`]+)`/g, (match, content) => {
        parts.push(<code key={`code-${partIndex++}`} className="bg-gray-100 px-1 rounded text-xs">{content}</code>);
        return `__CODE_${parts.length - 1}__`;
      });
      
      // Process links [text](url)
      remaining = remaining.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        parts.push(
          <a key={`link-${partIndex++}`} href={url} className="text-blue-600 underline text-xs" target="_blank" rel="noopener noreferrer">
            {linkText}
          </a>
        );
        return `__LINK_${parts.length - 1}__`;
      });
      
      // Split remaining text and insert processed parts
      const textParts = remaining.split(/(__(?:BOLD|ITALIC|CODE|LINK)_\d+__)/);
      const result: ReactNode[] = [];
      
      textParts.forEach((part, index) => {
        if (part.startsWith('__') && part.endsWith('__')) {
          const match = part.match(/__(?:BOLD|ITALIC|CODE|LINK)_(\d+)__/);
          if (match) {
            const partIndex = parseInt(match[1]);
            result.push(parts[partIndex]);
          }
        } else if (part) {
          result.push(<span key={`text-${index}`}>{part}</span>);
        }
      });
      
      return result.length > 0 ? result : [text];
    };
    
    // Handle headers
    if (line.match(/^#{1,6}\s+/)) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        const headerText = headerMatch[2];
        elements.push(
          <div key={`header-${lineIndex}`} className="font-bold text-xs mb-1">
            {processInlineMarkdown(headerText)}
          </div>
        );
        return;
      }
    }
    
    // Handle list items
    if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
      const listMatch = line.match(/^[\s]*(?:[-*+]|\d+\.)\s+(.+)/);
      if (listMatch) {
        elements.push(
          <div key={`list-${lineIndex}`} className="flex items-start gap-1 text-xs mb-1">
            <span className="text-gray-500 mt-0.5">•</span>
            <span>{processInlineMarkdown(listMatch[1])}</span>
          </div>
        );
        return;
      }
    }
    
    // Handle blockquotes
    if (line.match(/^>\s+/)) {
      const quoteMatch = line.match(/^>\s+(.+)/);
      if (quoteMatch) {
        elements.push(
          <div key={`quote-${lineIndex}`} className="border-l-2 border-gray-300 pl-2 text-xs italic text-gray-600 mb-1">
            {processInlineMarkdown(quoteMatch[1])}
          </div>
        );
        return;
      }
    }
    
    // Handle regular paragraphs
    elements.push(
      <span key={`para-${lineIndex}`} className="text-xs">
        {processInlineMarkdown(line)}
      </span>
    );
  });
  
  return elements;
}

