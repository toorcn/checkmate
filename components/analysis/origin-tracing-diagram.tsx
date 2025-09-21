'use client';

import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

// Add mobile-specific and fullscreen styles for ReactFlow
const mobileStyles = `
  .react-flow-mobile-container {
    position: relative;
    width: 100% !important;
    height: 100% !important;
  }
  .react-flow-mobile-container .react-flow__viewport {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Fullscreen styles */
  .react-flow-fullscreen-container {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 9999 !important;
    background: white !important;
    width: 100vw !important;
    height: 100vh !important;
  }
  
  .react-flow-fullscreen-container .react-flow__viewport {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Controls positioning and sizing */
  .react-flow__controls {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    height: auto !important;
    width: auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
  }
  
  .react-flow__controls button,
  .react-flow__controls .react-flow__controls-button {
    width: 32px !important;
    height: 32px !important;
    min-height: 32px !important;
    border-radius: 4px !important;
    border: 1px solid #ddd !important;
    background: white !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    color: #374151 !important;
    transition: all 0.2s ease !important;
  }
  
  .react-flow__controls button:hover,
  .react-flow__controls .react-flow__controls-button:hover {
    background: #f9fafb !important;
    border-color: #9ca3af !important;
  }
  
  @media (max-width: 640px) {
    .react-flow__controls {
      bottom: 10px !important;
      top: auto !important;
      right: 10px !important;
    }
    
    .react-flow__controls button,
    .react-flow__controls .react-flow__controls-button {
      width: 36px !important;
      height: 36px !important;
      min-height: 36px !important;
    }
  }
`;
import { Badge } from '../ui/badge';
import { 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Globe,
  Users,
  MessageSquare,
  Video,
  Megaphone,
  FileText,
  Shield,
  Brain,
  Clock,
  TrendingUp,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Helper function to parse simple markdown to text for plain text contexts
const parseMarkdownToText = (text: string): string => {
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
};

// Helper function to parse markdown and render as JSX elements
const parseMarkdownToJSX = (text: string): React.ReactNode[] => {
  if (!text || typeof text !== 'string') return [];
  
  const elements: React.ReactNode[] = [];
  
  // Split text by lines to handle different markdown elements
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    if (!line.trim()) return;
    
    
    // Process inline markdown elements
    const processInlineMarkdown = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
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
      const result: React.ReactNode[] = [];
      
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
        // Use div with font styling instead of dynamic header tags to avoid TypeScript issues
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
};

// Helper function to format text content for node display (removes markdown for plain text)
const formatNodeText = (text: string | undefined, maxLength: number = 200): string => {
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
};

// Helper function to format multiline text with markdown rendering
const formatMultilineText = (text: string | undefined, maxLines: number = 3): React.ReactElement => {
  if (!text || typeof text !== 'string') return <></>;
  
  // Parse markdown to JSX elements
  const elements = parseMarkdownToJSX(text);
  
  // Limit the number of elements displayed
  const limitedElements = elements.slice(0, maxLines);
  
  return (
    <div className="space-y-1">
      {limitedElements.map((element, index) => (
        <div key={index}>{element}</div>
      ))}
      {elements.length > maxLines && (
        <div className="text-xs text-gray-500 italic">...</div>
      )}
    </div>
  );
};

interface OriginTracingData {
  hypothesizedOrigin?: string;
  firstSeenDates?: Array<{ source: string; date?: string; url?: string }>;
  propagationPaths?: string[];
  evolutionSteps?: Array<{ platform: string; transformation: string; impact?: string; date?: string }>;
}

interface BeliefDriver {
  name: string;
  description: string;
  references?: Array<{ title: string; url: string }>;
}

interface FactCheckSource {
  url: string;
  title: string;
  source?: string;
  credibility: number;
}

interface OriginTracingDiagramProps {
  originTracing?: OriginTracingData;
  beliefDrivers?: BeliefDriver[];
  sources?: FactCheckSource[];
  verdict?: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
  content?: string;
  allLinks?: Array<{ url: string; title?: string }>;
}

// Custom node components
interface NodeData {
  label: string;
  verdict?: string;
  credibility?: number;
  url?: string;
  name?: string;
  description?: string;
  references?: Array<{ title: string; url: string }>;
  platform?: string;
  impact?: string;
  sourceName?: string;
}

// Helper function to get platform/source icons
const getPlatformIcon = (source: string) => {
  const lowerSource = source.toLowerCase();
  
  // Social Media Platforms - keep recognizable symbols but avoid letters
  if (lowerSource.includes('twitter') || lowerSource.includes('x.com')) {
    return <MessageSquare className="w-5 h-5 text-gray-800" />;
  }
  if (lowerSource.includes('facebook')) {
    return <Users className="w-5 h-5 text-blue-600" />;
  }
  if (lowerSource.includes('instagram')) {
    return <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded flex items-center justify-center text-xs font-bold">📷</div>;
  }
  if (lowerSource.includes('tiktok')) {
    return <Video className="w-5 h-5 text-gray-800" />;
  }
  if (lowerSource.includes('youtube')) {
    return <Video className="w-5 h-5 text-red-600" />;
  }
  if (lowerSource.includes('telegram')) {
    return <MessageSquare className="w-5 h-5 text-blue-500" />;
  }
  if (lowerSource.includes('whatsapp')) {
    return <MessageSquare className="w-5 h-5 text-green-500" />;
  }
  if (lowerSource.includes('reddit')) {
    return <MessageSquare className="w-5 h-5 text-orange-500" />;
  }
  if (lowerSource.includes('discord')) {
    return <MessageSquare className="w-5 h-5 text-indigo-500" />;
  }
  if (lowerSource.includes('linkedin')) {
    return <Users className="w-5 h-5 text-blue-700" />;
  }

  // Forums and Communities
  if (lowerSource.includes('4chan') || lowerSource.includes('/pol/')) {
    return <MessageSquare className="w-5 h-5 text-green-600" />;
  }
  if (lowerSource.includes('forum') || lowerSource.includes('board')) {
    return <Users className="w-5 h-5 text-gray-600" />;
  }

  // Fact-checking Organizations - use generic shield icon for fact-checkers
  if (lowerSource.includes('snopes') || lowerSource.includes('factcheck.org') || lowerSource.includes('politifact')) {
    return <Shield className="w-5 h-5 text-emerald-600" />;
  }
  
  // News Organizations - use generic news icon for major news outlets
  if (lowerSource.includes('reuters') || lowerSource.includes('ap news') || lowerSource.includes('associated press') || lowerSource.includes('bbc') || lowerSource.includes('cnn')) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }

  // Default icons by type
  if (lowerSource.includes('news') || lowerSource.includes('media')) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }
  if (lowerSource.includes('blog') || lowerSource.includes('post')) {
    return <FileText className="w-5 h-5 text-purple-600" />;
  }
  if (lowerSource.includes('video')) {
    return <Video className="w-5 h-5 text-red-600" />;
  }
  if (lowerSource.includes('influencer') || lowerSource.includes('creator')) {
    return <Megaphone className="w-5 h-5 text-pink-600" />;
  }

  // Generic fallback
  return <Globe className="w-5 h-5 text-gray-600" />;
};

const getBiasIcon = (biasName: string) => {
  const lowerName = biasName.toLowerCase();
  
  if (lowerName.includes('confirmation')) {
    return <Brain className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('availability')) {
    return <Clock className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('social') || lowerName.includes('proof')) {
    return <Users className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('trend') || lowerName.includes('bandwagon')) {
    return <TrendingUp className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('sharing') || lowerName.includes('viral')) {
    return <Share2 className="w-4 h-4 text-violet-600" />;
  }
  
  return <Brain className="w-4 h-4 text-violet-600" />;
};

const OriginNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg min-w-[220px] max-w-[320px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.label)}
      </div>
      <div className="font-semibold text-blue-900 text-sm">Original Source</div>
    </div>
    <div className="text-sm text-blue-800 leading-relaxed break-words">
      {formatMultilineText(data.label, 2)}
    </div>
  </div>
);

const PropagationNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-orange-50 border-2 border-orange-200 rounded-xl shadow-lg min-w-[200px] max-w-[280px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.platform || data.label)}
      </div>
      <div className="font-semibold text-orange-900 text-sm">Propagation</div>
    </div>
    <div className="text-sm text-orange-800 leading-relaxed break-words">
      {formatMultilineText(data.label, 2)}
    </div>
  </div>
);

const EvolutionNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl shadow-lg min-w-[220px] max-w-[300px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.platform || data.label)}
      </div>
      <div className="font-semibold text-purple-900 text-sm">
        {formatNodeText(data.platform || 'Evolution', 50)}
      </div>
    </div>
    <div className="text-sm text-purple-800 leading-relaxed mb-2 break-words">
      {formatMultilineText(data.label, 2)}
    </div>
    {data.impact && (
      <div className="text-xs text-purple-600 italic break-words">
        Impact: {formatNodeText(data.impact, 80)}
      </div>
    )}
  </div>
);

const ClaimNode = ({ data }: { data: NodeData }) => {
  const verdictColors = {
    verified: 'bg-green-50 border-green-200 text-green-900',
    misleading: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    false: 'bg-red-50 border-red-200 text-red-900',
    unverified: 'bg-gray-50 border-gray-200 text-gray-900',
    satire: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  const verdictIcons = {
    verified: CheckCircle,
    misleading: AlertTriangle,
    false: XCircle,
    unverified: HelpCircle,
    satire: HelpCircle,
  };

  const Icon = verdictIcons[data.verdict as keyof typeof verdictIcons] || HelpCircle;

  return (
    <div className={`px-6 py-5 border-2 rounded-xl shadow-xl min-w-[280px] max-w-[400px] ${verdictColors[data.verdict as keyof typeof verdictColors] || verdictColors.unverified}`}>
      {/* All-direction handles for the central claim node */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 font-semibold mb-3">
        <Icon className="h-5 w-5" />
        <span className="text-base">Current Claim</span>
      </div>
      <div className="text-sm mb-3 leading-relaxed break-words">
        {formatMultilineText(data.label, 3)}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-medium">
          {data.verdict}
        </Badge>
        <Shield className="h-3 w-3 opacity-60" />
      </div>
    </div>
  );
};

const SourceNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-lg min-w-[220px] max-w-[320px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.sourceName || data.label)}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-emerald-900 text-sm mb-1">
          {data.sourceName ? formatNodeText(data.sourceName, 30) : 'Fact-Check Source'}
        </div>
        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800">
          {data.credibility}% credible
        </Badge>
      </div>
    </div>
    <div className="text-sm text-emerald-800 mb-3 leading-relaxed break-words">
      {formatMultilineText(data.label, 2)}
    </div>
    {data.url && (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900 underline font-medium break-all"
      >
        View Source <ExternalLink className="h-3 w-3" />
      </a>
    )}
  </div>
);

const BeliefDriverNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-violet-50 border-2 border-violet-200 rounded-xl shadow-lg min-w-[220px] max-w-[360px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getBiasIcon(data.name || '')}
      </div>
      <div className="font-semibold text-violet-900 text-sm">Why People Believe</div>
    </div>
    <div className="text-sm text-violet-800 font-medium mb-2 break-words">
      {formatNodeText(data.name, 60)}
    </div>
    <div className="text-xs text-violet-700 leading-relaxed mb-2 break-words">
      {formatMultilineText(data.description, 3)}
    </div>
    {Array.isArray(data.references) && data.references.length > 0 && (
      <div className="mt-2 space-y-1">
        {data.references.slice(0, 2).map((ref, idx) => (
          <a
            key={idx}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[11px] text-violet-800 underline break-all"
            title={ref.title}
          >
            {formatNodeText(ref.title, 50)}
          </a>
        ))}
      </div>
    )}
  </div>
);

const nodeTypes = {
  origin: OriginNode,
  propagation: PropagationNode,
  evolution: EvolutionNode,
  claim: ClaimNode,
  source: SourceNode,
  beliefDriver: BeliefDriverNode,
};

// Helper function to extract meaningful claim content
const extractClaimContent = (
  content?: string,
  originTracing?: OriginTracingData,
  beliefDrivers?: BeliefDriver[],
  sources?: FactCheckSource[]
): string => {
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
};

// Helper function to detect and resolve node overlaps
const resolveOverlaps = (nodes: Node[]): Node[] => {
  const resolvedNodes = [...nodes];
  const nodeSpacing = 280; // Reduced minimum spacing between nodes
  const verticalSpacing = 180; // Reduced minimum vertical spacing
  const gridSize = 40; // Snap to grid for cleaner layout
  
  // Multiple passes to resolve all overlaps
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const nodeA = resolvedNodes[i];
        const nodeB = resolvedNodes[j];
        
        const horizontalDistance = Math.abs(nodeA.position.x - nodeB.position.x);
        const verticalDistance = Math.abs(nodeA.position.y - nodeB.position.y);
        
        // Check if nodes are too close horizontally (same row-ish)
        if (verticalDistance < 120 && horizontalDistance < nodeSpacing) {
          const adjustment = nodeSpacing - horizontalDistance + 40; // Reduced buffer
          
          // Move the rightmost node further right
          if (nodeA.position.x < nodeB.position.x) {
            nodeB.position.x += adjustment;
          } else {
            nodeA.position.x += adjustment;
          }
        }
        
        // Check if nodes are too close vertically (same column-ish)
        if (horizontalDistance < 120 && verticalDistance < verticalSpacing) {
          const adjustment = verticalSpacing - verticalDistance + 40; // Reduced buffer
          
          // Move the lower node further down
          if (nodeA.position.y < nodeB.position.y) {
            nodeB.position.y += adjustment;
          } else {
            nodeA.position.y += adjustment;
          }
        }
      }
    }
  }
  
  // Snap all nodes to grid for cleaner layout
  resolvedNodes.forEach(node => {
    node.position.x = Math.round(node.position.x / gridSize) * gridSize;
    node.position.y = Math.round(node.position.y / gridSize) * gridSize;
  });
  
  return resolvedNodes;
};

// Helper function to create logical flow layout
const createLogicalFlow = (
  originNodeId: string | null,
  evolutionNodes: string[],
  claimNodeId: string,
  beliefDriverNodes: string[],
  sourceNodes: string[],
  linkNodes: string[],
  nodes: Node[]
): Node[] => {
  const centerX = 1200;
  const centerY = 400;
  
  // Create a more logical flow pattern
  const flowLayout = {
    // Origin on far left
    origin: { x: centerX - 800, y: centerY },
    
    // Evolution chain flowing left to right toward center - reduced spacing
    evolution: {
      startX: centerX - 700,
      endX: centerX - 250,
      y: centerY,
      spacing: Math.max(250, 500 / Math.max(evolutionNodes.length, 1))
    },
    
    // Claim at center-right (destination of flow)
    claim: { x: centerX, y: centerY },
    
    // Belief drivers above in arc formation - reduced spacing
    beliefs: {
      centerX: centerX - 350,
      y: centerY - 300,
      radius: 450,
      startAngle: -Math.PI / 2.5,
      endAngle: Math.PI / 2.5
    },
    
    // Sources below in arc formation - reduced spacing
    sources: {
      centerX: centerX,
      y: centerY + 300,
      radius: 450,
      startAngle: Math.PI / 4,
      endAngle: Math.PI - Math.PI / 4
    },
    
    // Links on the right side in column - reduced spacing
    links: {
      x: centerX + 500,
      startY: centerY - 250,
      spacing: 150
    }
  };
  
  const updatedNodes = nodes.map(node => {
    // Update origin position
    if (node.id === originNodeId) {
      return { ...node, position: flowLayout.origin };
    }
    
    // Update evolution nodes
    const evolutionIndex = evolutionNodes.indexOf(node.id);
    if (evolutionIndex !== -1) {
      const progress = evolutionNodes.length > 1 ? evolutionIndex / (evolutionNodes.length - 1) : 0;
      const x = flowLayout.evolution.startX + (flowLayout.evolution.endX - flowLayout.evolution.startX) * progress;
      const yOffset = (evolutionIndex % 3 - 1) * 100; // Reduced vertical stagger
      return { ...node, position: { x, y: flowLayout.evolution.y + yOffset } };
    }
    
    // Update claim position
    if (node.id === claimNodeId) {
      return { ...node, position: flowLayout.claim };
    }
    
    // Update belief driver positions in arc
    const beliefIndex = beliefDriverNodes.indexOf(node.id);
    if (beliefIndex !== -1 && beliefDriverNodes.length > 0) {
      const angle = beliefDriverNodes.length === 1 
        ? 0 
        : flowLayout.beliefs.startAngle + (flowLayout.beliefs.endAngle - flowLayout.beliefs.startAngle) * (beliefIndex / (beliefDriverNodes.length - 1));
      const x = flowLayout.beliefs.centerX + Math.cos(angle) * flowLayout.beliefs.radius;
      const y = flowLayout.beliefs.y + Math.sin(angle) * flowLayout.beliefs.radius / 2;
      return { ...node, position: { x, y } };
    }
    
    // Update source positions in arc
    const sourceIndex = sourceNodes.indexOf(node.id);
    if (sourceIndex !== -1 && sourceNodes.length > 0) {
      const angle = sourceNodes.length === 1 
        ? Math.PI / 2 
        : flowLayout.sources.startAngle + (flowLayout.sources.endAngle - flowLayout.sources.startAngle) * (sourceIndex / (sourceNodes.length - 1));
      const x = flowLayout.sources.centerX + Math.cos(angle) * flowLayout.sources.radius;
      const y = flowLayout.sources.y + Math.sin(angle) * flowLayout.sources.radius / 3;
      return { ...node, position: { x, y } };
    }
    
    // Update link positions in column
    const linkIndex = linkNodes.indexOf(node.id);
    if (linkIndex !== -1) {
      return { 
        ...node, 
        position: { 
          x: flowLayout.links.x, 
          y: flowLayout.links.startY + linkIndex * flowLayout.links.spacing 
        } 
      };
    }
    
    return node;
  });
  
  return resolveOverlaps(updatedNodes);
};

export function OriginTracingDiagram({
  originTracing,
  beliefDrivers = [],
  sources = [],
  verdict = 'unverified',
  content = '',
  allLinks = [],
}: OriginTracingDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen operation failed:', error);
      // Fallback to CSS-only fullscreen
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // Handle fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement;
      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;
    
    // Track node IDs for logical flow layout
    let originNodeId: string | null = null;
    const evolutionNodes: string[] = [];
    let claimNodeId = '';
    const beliefDriverNodes: string[] = [];
    const sourceNodes: string[] = [];
    const linkNodes: string[] = [];

    // Calculate total content to fit properly on screen with center claim
    const totalEvolutionSteps = Math.max(
      (originTracing?.firstSeenDates?.length || 0) + 
      (originTracing?.propagationPaths?.length || 0),
      1
    );
    // const hasOrigin = !!originTracing?.hypothesizedOrigin; // Removed unused variable
    const centerX = 1200; // Fixed center position
    const evolutionWidth = Math.min(800, totalEvolutionSteps * 180); // Width for evolution chain
    
    // Define layout for interconnected network with centered claim
    const LAYOUT = {
      // Current claim at center - always centered
      currentClaim: { 
        x: centerX, 
        y: 320 
      },
      
      // Evolution timeline - flows toward center from left
      evolution: {
        startX: centerX - evolutionWidth - 150,
        endX: centerX - 150,
        y: 320,
        stepSpacing: Math.max(150, evolutionWidth / Math.max(totalEvolutionSteps, 1)),
        verticalSpread: 100,
      },
      
      // Belief drivers above center - reduced spacing
      beliefs: { 
        startX: centerX - (Math.min(beliefDrivers.length, 3) * 320) / 2,
        y: 80, 
        spacing: 320,
        maxPerRow: 3
      },
      
      // Sources below center - reduced spacing  
      sources: { 
        startX: centerX - (Math.min(sources.length, 3) * 300) / 2, 
        y: 480, 
        spacing: 300,
        maxPerRow: 3 // Reduce per row to ensure better spacing
      },
      
      // All links at bottom - reduced spacing
      allLinks: {
        startX: centerX - (Math.min(allLinks.length, 4) * 280) / 2,
        y: 650,
        spacing: 280,
        maxPerRow: 4, // Reduce per row to ensure better spacing
      },
      
      // Node dimensions - optimized spacing
      nodeWidth: 260,
      nodeHeight: 110,
      minSpacing: 50,
      
      // Layout bounds
      centerX,
      totalHeight: 750
    };

    // Build chronological evolution chain
    const localEvolutionNodes: string[] = [];
    
    // Step 1: Origin node (if available)
    let previousNodeId: string | null = null;
    if (originTracing?.hypothesizedOrigin) {
      const currentOriginNodeId = `origin-${nodeId++}`;
      originNodeId = currentOriginNodeId;
      nodes.push({
        id: currentOriginNodeId,
        type: 'origin',
        position: { 
          x: LAYOUT.evolution.startX, 
          y: LAYOUT.evolution.y 
        },
        data: { label: originTracing.hypothesizedOrigin },
      });
      localEvolutionNodes.push(currentOriginNodeId);
      previousNodeId = currentOriginNodeId;
    }

    // Step 2: Create evolution chain from first seen dates and propagation paths
    const evolutionSteps: Array<{ label: string; date?: string; platform?: string; impact?: string; type: 'timeline' | 'propagation' | 'evolution' }> = [];
    
    // Combine and sort timeline entries
    if (originTracing?.firstSeenDates) {
      originTracing.firstSeenDates.forEach(dateInfo => {
        evolutionSteps.push({
          label: `${dateInfo.source}${dateInfo.date ? ` (${dateInfo.date})` : ''}`,
          date: dateInfo.date,
          type: 'timeline'
        });
      });
    }

    // Add evolution steps with meaningful transformations
    if (originTracing?.evolutionSteps) {
      originTracing.evolutionSteps.forEach(step => {
        evolutionSteps.push({
          label: step.transformation || `Spread via ${step.platform}`,
          platform: step.platform,
          impact: step.impact,
          date: step.date,
          type: 'evolution'
        });
      });
    }
    
    // Fallback to legacy propagation paths if no evolution steps
    if ((!originTracing?.evolutionSteps || originTracing.evolutionSteps.length === 0) && originTracing?.propagationPaths) {
      originTracing.propagationPaths.forEach(path => {
        evolutionSteps.push({
          label: `Content spread through ${path}`,
          platform: path,
          type: 'propagation'
        });
      });
    }

    // Sort by date if available, otherwise keep original order
    evolutionSteps.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0; // Keep original order if no dates
    });

    // Create interconnected evolution chain
    evolutionSteps.forEach((step, index) => {
      const stepNodeId = `evolution-${nodeId++}`;
      const stepNumber = previousNodeId ? localEvolutionNodes.length : 0;
      
      // Alternate positions to prevent overlaps - use staggered pattern with much more spacing
      const yOffset = (index % 3 === 0) ? 0 : (index % 3 === 1 ? -80 : 80);
      
      nodes.push({
        id: stepNodeId,
        type: step.type === 'timeline' ? 'propagation' : step.type === 'evolution' ? 'evolution' : 'propagation',
        position: { 
          x: LAYOUT.evolution.startX + stepNumber * LAYOUT.evolution.stepSpacing,
          y: LAYOUT.evolution.y + yOffset
        },
        data: { 
          label: step.label,
          platform: step.platform,
          impact: step.impact
        },
      });

      localEvolutionNodes.push(stepNodeId);
      evolutionNodes.push(stepNodeId);

      // Connect to previous node in chain - only for direct sequence to keep it simple
      if (previousNodeId && index < 4) { // Limit connections to first 4 steps to reduce complexity
        edges.push({
          id: `${previousNodeId}-${stepNodeId}`,
          source: previousNodeId,
          sourceHandle: 'right',
          target: stepNodeId,
          targetHandle: 'left',
          type: 'smoothstep',
          animated: index < 2, // Animate fewer connections
          markerEnd: { type: MarkerType.ArrowClosed },
          label: index === 0 ? 'evolves' : '', // Only label first connection
          style: { 
            stroke: step.type === 'timeline' ? '#0066cc' : '#ff8800', 
            strokeWidth: 2,
            opacity: 0.8
          },
        });
      }

      previousNodeId = stepNodeId;
    });

    // Step 3: Current claim at the end of evolution
    const currentClaimNodeId = `claim-${nodeId++}`;
    claimNodeId = currentClaimNodeId;
    nodes.push({
        id: currentClaimNodeId,
      type: 'claim',
      position: { x: LAYOUT.currentClaim.x, y: LAYOUT.currentClaim.y },
      data: { 
        label: extractClaimContent(content, originTracing, beliefDrivers, sources), 
        verdict 
      },
    });

    // Connect final evolution step to current claim
    if (previousNodeId) {
      edges.push({
        id: `${previousNodeId}-${currentClaimNodeId}`,
        source: previousNodeId,
        sourceHandle: 'right',
        target: currentClaimNodeId,
        targetHandle: 'left',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'becomes',
        style: { stroke: '#dc2626', strokeWidth: 3 },
      });
    }

    // Add belief drivers above evolution chain - show how they influence belief molding
    beliefDrivers.forEach((driver, index) => {
      const driverNodeId = `belief-${nodeId++}`;
      beliefDriverNodes.push(driverNodeId);
      const col = index % LAYOUT.beliefs.maxPerRow;
      const row = Math.floor(index / LAYOUT.beliefs.maxPerRow);
      
      // Ensure adequate spacing to prevent overlaps
      const x = LAYOUT.beliefs.startX + col * LAYOUT.beliefs.spacing;
      const y = LAYOUT.beliefs.y - row * 120; // Reduced row spacing
      
      nodes.push({
        id: driverNodeId,
        type: 'beliefDriver',
        position: { x, y },
        data: { 
          name: driver.name, 
          description: driver.description,
          references: driver.references
        },
      });

      // Only connect belief drivers to the final claim to reduce visual complexity
      // No connections to intermediate evolution steps to prevent edge crossings
      edges.push({
        id: `${driverNodeId}-${currentClaimNodeId}`,
        source: driverNodeId,
        sourceHandle: 'bottom',
        target: currentClaimNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: index === 0 ? 'influences belief' : '', // Only label first connection
        style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.8 },
      });
    });

    // Add fact-check sources below evolution chain
    sources.forEach((source, index) => {
      const sourceNodeId = `source-${nodeId++}`;
      sourceNodes.push(sourceNodeId);
      const col = index % LAYOUT.sources.maxPerRow;
      const row = Math.floor(index / LAYOUT.sources.maxPerRow);
      
      // Extract source name from URL if source field is not available
      const sourceName = source.source || new URL(source.url).hostname.replace('www.', '');
      
      nodes.push({
        id: sourceNodeId,
        type: 'source',
        position: { 
          x: LAYOUT.sources.startX + col * LAYOUT.sources.spacing,
          y: LAYOUT.sources.y + row * 130 // Reduced row spacing for multiple rows
        },
        data: { 
          label: source.title, 
          sourceName: sourceName,
          credibility: source.credibility,
          url: source.url 
        },
      });

      edges.push({
        id: `${currentClaimNodeId}-${sourceNodeId}`,
        source: currentClaimNodeId,
        sourceHandle: 'bottom',
        target: sourceNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'fact-checked by',
        style: { stroke: '#10b981', strokeWidth: 2 },
      });
    });

    // Add all links at bottom - only if they're not already represented in sources
    // Filter out links that are already in the main sources to avoid duplication
    const sourceUrls = new Set(sources.map(source => source.url));
    const uniqueLinks = allLinks.filter(link => !sourceUrls.has(link.url));
    
    uniqueLinks.slice(0, 8).forEach((link, index) => { // Limit to 8 for better layout
      const linkNodeId = `alllink-${nodeId++}`;
      linkNodes.push(linkNodeId);
      const col = index % LAYOUT.allLinks.maxPerRow;
      const row = Math.floor(index / LAYOUT.allLinks.maxPerRow);
      
      // Ensure links don't extend beyond layout bounds
      const x = Math.min(
        LAYOUT.allLinks.startX + col * LAYOUT.allLinks.spacing,
        LAYOUT.centerX + 600 - LAYOUT.nodeWidth
      );
      
      // Find matching source to get actual credibility, or use a default
      const matchingSource = sources.find(source => source.url === link.url);
      const credibility = matchingSource?.credibility ?? 0.5; // Use actual credibility or neutral default
      
      // Extract source name from URL for consistency
      const sourceName = matchingSource?.source || new URL(link.url).hostname.replace('www.', '');
      
      nodes.push({
        id: linkNodeId,
        type: 'source',
        position: { 
          x,
          y: LAYOUT.allLinks.y + row * 100 // Reduced row spacing
        },
        data: {
          label: link.title || link.url,
          sourceName: sourceName,
          credibility: Math.round(credibility * 100), // Convert to percentage like other sources
          url: link.url,
        },
      });

      // No connections to avoid edge crossing complexity - nodes are positioned to show relationship spatially
    });

    // Apply logical flow layout and overlap resolution
    const optimizedNodes = createLogicalFlow(
      originNodeId,
      evolutionNodes,
      claimNodeId,
      beliefDriverNodes,
      sourceNodes,
      linkNodes,
      nodes
    );
    
    return { nodes: optimizedNodes, edges };
  }, [originTracing, beliefDrivers, sources, verdict, content, allLinks]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(() => {
    // Disable manual connections for this read-only diagram
  }, []);

  if (!originTracing?.hypothesizedOrigin && !beliefDrivers.length && !sources.length) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      <div
        ref={containerRef}
        className={
          isFullscreen 
            ? "react-flow-fullscreen-container"
            : "w-full h-[600px] sm:h-[500px] md:h-[600px] p-3 md:pb-0 shadow-lg mb-6 bg-white border rounded-lg"
        }
      >
        <div className="h-full">
          {!isFullscreen && (
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Step-by-step evolution from origin through platforms to current state
                    <span className="hidden sm:inline ml-2 text-gray-400">• Scroll wheel to zoom, controls to reset view</span>
                    <span className="sm:hidden ml-2 text-gray-400">• Pinch to zoom, tap controls to reset</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className={
            isFullscreen 
              ? "h-full w-full bg-gradient-to-br from-gray-50 to-white relative"
              : "h-[calc(100%-3.5rem)] w-full border rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white relative"
          }>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ 
              padding: 0.15, // More padding on mobile
              includeHiddenNodes: false,
              minZoom: 0.1, // Lower min zoom for mobile
              maxZoom: 1.5
            }}
            minZoom={0.1} // Lower min zoom for mobile
            maxZoom={1.5}
            attributionPosition="bottom-left"
            defaultViewport={{ x: 0, y: 0, zoom: 0.2 }} // Lower default zoom for mobile
            proOptions={{ hideAttribution: false }}
            // Ensure proper container sizing
            style={{ width: '100%', height: '100%' }}
            className="react-flow-mobile-container"
            // Disable interactions that interfere with scrolling
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}  // Enable to allow link clicks
            panOnDrag={true}
            // Keep zoom functionality for better UX
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}  // Disable to prevent accidental interactions
            // Allow page scrolling when not actively zooming
            preventScrolling={false}
            // Prevent selection visual feedback while allowing clicks
            selectNodesOnDrag={false}
            // Disable multi-selection
            multiSelectionKeyCode={null}
          >
            <Controls 
              showInteractive={false}
              showZoom={true}  // Keep zoom controls visible
              showFitView={true}  // Allow users to reset view
              position="top-right"
            >
              {/* Custom fullscreen control */}
              <div 
                className="react-flow__controls-button" 
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </div>
            </Controls>
            <Background gap={15} size={1} color="#f1f5f9" />
          </ReactFlow>
          </div>
        </div>
      </div>
    </>
  );
}