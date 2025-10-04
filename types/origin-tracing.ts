/**
 * Origin Tracing Types
 * 
 * Type definitions for the origin tracing diagram and related components
 */

import { Node } from '@xyflow/react';

export interface OriginTracingData {
  hypothesizedOrigin?: string;
  firstSeenDates?: Array<{ source: string; date?: string; url?: string }>;
  propagationPaths?: string[];
  evolutionSteps?: Array<{ 
    platform: string; 
    transformation: string; 
    impact?: string; 
    date?: string;
  }>;
}

export interface BeliefDriver {
  name: string;
  description: string;
  references?: Array<{ title: string; url: string }>;
}

export interface FactCheckSource {
  url: string;
  title: string;
  source?: string;
  credibility: number;
}

export interface OriginTracingDiagramProps {
  originTracing?: OriginTracingData;
  beliefDrivers?: BeliefDriver[];
  sources?: FactCheckSource[];
  verdict?: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
  content?: string;
  allLinks?: Array<{ url: string; title?: string }>;
}

export interface NodeData {
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

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  nodeId: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  color: string;
}

export interface OriginTracingGraphResult {
  nodes: Node[];
  edges: any[];
  navSections: NavSection[];
}

