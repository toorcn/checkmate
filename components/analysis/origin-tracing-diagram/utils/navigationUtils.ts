/**
 * Navigation Utilities
 * 
 * Helper functions for the navigation sidebar
 */

import { Node } from '@xyflow/react';
import { NavSection } from '../../../../types/origin-tracing';

/**
 * Get credibility-based color classes for gradients
 */
export function getCredibilityColor(score: number): {
  gradient: string;
  border: string;
  text: string;
  badge: string;
} {
  if (score >= 80) {
    return {
      gradient: 'from-emerald-50 to-green-50',
      border: 'border-emerald-400',
      text: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  } else if (score >= 50) {
    return {
      gradient: 'from-blue-50 to-cyan-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    };
  } else if (score >= 30) {
    return {
      gradient: 'from-yellow-50 to-amber-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
  } else {
    return {
      gradient: 'from-red-50 to-rose-50',
      border: 'border-red-400',
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800 border-red-300',
    };
  }
}

/**
 * Get CSS gradient string for connection lines
 */
export function getCredibilityGradient(score: number): string {
  if (score >= 80) {
    return 'linear-gradient(135deg, #10b981, #059669)';
  } else if (score >= 50) {
    return 'linear-gradient(135deg, #3b82f6, #06b6d4)';
  } else if (score >= 30) {
    return 'linear-gradient(135deg, #f59e0b, #d97706)';
  } else {
    return 'linear-gradient(135deg, #ef4444, #f43f5e)';
  }
}

/**
 * Get verdict-based color classes
 */
export function getVerdictColor(verdict: string): {
  gradient: string;
  border: string;
  text: string;
  badge: string;
} {
  switch (verdict.toLowerCase()) {
    case 'verified':
    case 'true':
      return getCredibilityColor(95);
    case 'misleading':
    case 'satire':
      return getCredibilityColor(40);
    case 'false':
      return getCredibilityColor(10);
    case 'unverified':
    default:
      return getCredibilityColor(60);
  }
}

/**
 * Compute statistics for a section
 */
export function getSectionStats(section: NavSection, nodes: Node[]): {
  totalItems: number;
  avgCredibility: number;
  hasAlerts: boolean;
} {
  let totalItems = 0;
  let credibilitySum = 0;
  let credibilityCount = 0;
  let hasAlerts = false;

  const processItems = (items: any[]) => {
    items.forEach((item) => {
      const node = nodes.find(n => n.id === item.nodeId);
      if (node && node.data.credibility !== undefined) {
        credibilitySum += Number(node.data.credibility);
        credibilityCount++;
      }
      // Check for low credibility as "alert"
      if (node && node.data.credibility !== undefined && Number(node.data.credibility) < 40) {
        hasAlerts = true;
      }
    });
  };

  if (section.subsections) {
    section.subsections.forEach((subsection) => {
      totalItems += subsection.items.length;
      processItems(subsection.items);
    });
  } else {
    totalItems = section.items.length;
    processItems(section.items);
  }

  return {
    totalItems,
    avgCredibility: credibilityCount > 0 ? Math.round(credibilitySum / credibilityCount) : 0,
    hasAlerts,
  };
}

/**
 * Find the current claim node
 */
export function getCurrentClaimNode(nodes: Node[]): Node | null {
  return nodes.find((node) => node.type === 'claim' || node.id.includes('current-claim')) || null;
}

/**
 * Get section type colors for connection lines
 */
export function getSectionColor(sectionId: string): string {
  if (sectionId.includes('evolution') || sectionId.includes('timeline')) {
    return '#3b82f6'; // Blue
  } else if (sectionId.includes('belief') || sectionId.includes('driver')) {
    return '#8b5cf6'; // Purple
  } else if (sectionId.includes('source') || sectionId.includes('fact')) {
    return '#10b981'; // Green/Teal
  }
  return '#64748b'; // Slate default
}

