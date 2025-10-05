'use client';

import React from 'react';
import { Button } from '../../../ui/button';
import { Pause, X as XIcon, Maximize } from 'lucide-react';

interface GraphControlsProps {
  isExpanded: boolean;
  isAnimating: boolean;
  onPauseAnimation: () => void;
  onStopAnimation: () => void;
  onFitView: () => void;
}

export function GraphControls({
  isExpanded,
  isAnimating,
  onPauseAnimation,
  onStopAnimation,
  onFitView,
}: GraphControlsProps) {
  return (
    <div className={isExpanded ? "p-5 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm" : "p-4 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white"}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <div>
            <p className="text-sm font-semibold text-slate-900 tracking-tight">
              Origin Tracing Diagram
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Interactive evolution map • Click to explore
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAnimating && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onPauseAnimation}
                className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-slate-400 bg-white hover:bg-slate-50 text-slate-900"
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onStopAnimation}
                className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-slate-400 bg-white hover:bg-slate-50 text-slate-900"
              >
                <XIcon className="h-3.5 w-3.5 mr-1.5" />
                Stop
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onFitView}
            className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-slate-400 bg-white hover:bg-slate-50 text-slate-900"
            title="Fit graph to view"
          >
            <Maximize className="h-3.5 w-3.5 mr-1.5" />
            Fit View
          </Button>
        </div>
      </div>
    </div>
  );
}

