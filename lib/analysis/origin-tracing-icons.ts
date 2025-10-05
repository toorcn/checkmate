/**
 * Origin Tracing Icon Utilities
 * 
 * Helper functions to get appropriate icons for platforms, sources, and biases
 */

import React from 'react';
import {
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
} from 'lucide-react';

/**
 * Get platform/source icon based on source name
 */
export function getPlatformIcon(source: string): React.ReactNode {
  const lowerSource = source.toLowerCase();
  
  // Social Media Platforms - keep recognizable symbols but avoid letters
  if (lowerSource.includes('twitter') || lowerSource.includes('x.com')) {
    return React.createElement(MessageSquare, { className: 'w-5 h-5 text-gray-800' });
  }
  if (lowerSource.includes('facebook')) {
    return React.createElement(Users, { className: 'w-5 h-5 text-blue-600' });
  }
  if (lowerSource.includes('instagram')) {
    return React.createElement('div', { 
      className: 'w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded flex items-center justify-center text-xs font-bold' 
    }, '📷');
  }
  if (lowerSource.includes('tiktok')) {
    return React.createElement(Video, { className: 'w-5 h-5 text-gray-800' });
  }
  if (lowerSource.includes('youtube')) {
    return React.createElement(Video, { className: 'w-5 h-5 text-red-600' });
  }
  if (lowerSource.includes('telegram')) {
    return React.createElement(MessageSquare, { className: 'w-5 h-5 text-blue-500' });
  }
  if (lowerSource.includes('whatsapp')) {
    return React.createElement(MessageSquare, { className: 'w-5 h-5 text-green-500' });
  }
  if (lowerSource.includes('reddit')) {
    return React.createElement(MessageSquare, { className: 'w-5 h-5 text-orange-500' });
  }
  if (lowerSource.includes('discord')) {
    return React.createElement(MessageSquare, { className: 'w-5 h-5 text-indigo-500' });
  }
  if (lowerSource.includes('linkedin')) {
    return React.createElement(Users, { className: 'w-5 h-5 text-blue-700' });
  }

  // Forums and Communities
  if (lowerSource.includes('4chan') || lowerSource.includes('/pol/')) {
    return React.createElement(MessageSquare, { className: 'w-5 h-5 text-green-600' });
  }
  if (lowerSource.includes('forum') || lowerSource.includes('board')) {
    return React.createElement(Users, { className: 'w-5 h-5 text-gray-600' });
  }

  // Fact-checking Organizations - use generic shield icon for fact-checkers
  if (lowerSource.includes('snopes') || lowerSource.includes('factcheck.org') || lowerSource.includes('politifact')) {
    return React.createElement(Shield, { className: 'w-5 h-5 text-emerald-600' });
  }
  
  // News Organizations - use generic news icon for major news outlets
  if (lowerSource.includes('reuters') || lowerSource.includes('ap news') || lowerSource.includes('associated press') || lowerSource.includes('bbc') || lowerSource.includes('cnn')) {
    return React.createElement(FileText, { className: 'w-5 h-5 text-blue-600' });
  }

  // Default icons by type
  if (lowerSource.includes('news') || lowerSource.includes('media')) {
    return React.createElement(FileText, { className: 'w-5 h-5 text-blue-600' });
  }
  if (lowerSource.includes('blog') || lowerSource.includes('post')) {
    return React.createElement(FileText, { className: 'w-5 h-5 text-purple-600' });
  }
  if (lowerSource.includes('video')) {
    return React.createElement(Video, { className: 'w-5 h-5 text-red-600' });
  }
  if (lowerSource.includes('influencer') || lowerSource.includes('creator')) {
    return React.createElement(Megaphone, { className: 'w-5 h-5 text-pink-600' });
  }

  // Generic fallback
  return React.createElement(Globe, { className: 'w-5 h-5 text-gray-600' });
}

/**
 * Get bias icon based on bias name
 */
export function getBiasIcon(biasName: string): React.ReactNode {
  const lowerName = biasName.toLowerCase();
  
  if (lowerName.includes('confirmation')) {
    return React.createElement(Brain, { className: 'w-4 h-4 text-violet-600' });
  }
  if (lowerName.includes('availability')) {
    return React.createElement(Clock, { className: 'w-4 h-4 text-violet-600' });
  }
  if (lowerName.includes('social') || lowerName.includes('proof')) {
    return React.createElement(Users, { className: 'w-4 h-4 text-violet-600' });
  }
  if (lowerName.includes('trend') || lowerName.includes('bandwagon')) {
    return React.createElement(TrendingUp, { className: 'w-4 h-4 text-violet-600' });
  }
  if (lowerName.includes('sharing') || lowerName.includes('viral')) {
    return React.createElement(Share2, { className: 'w-4 h-4 text-violet-600' });
  }
  
  return React.createElement(Brain, { className: 'w-4 h-4 text-violet-600' });
}
