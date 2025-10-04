'use client';

import React from 'react';
import { Button } from '../../../ui/button';
import { Pause, X as XIcon, Minimize2, Maximize2 } from 'lucide-react';

interface GraphControlsProps {
  isFullscreen: boolean;
  isAnimating: boolean;
  onToggleFullscreen: () => void;
  onPauseAnimation: () => void;
  onStopAnimation: () => void;
}

export function GraphControls({
  isFullscreen,
  isAnimating,
  onToggleFullscreen,
  onPauseAnimation,
  onStopAnimation,
}: GraphControlsProps) {
  return (
    <div className={isFullscreen ? "p-5 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm" : "p-4 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white"}>
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
                className="h-8 text-xs font-semibold shadow-sm hover:shadow-md transition-all border-slate-300 bg-white hover:bg-slate-50"
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onStopAnimation}
                className="h-8 text-xs font-semibold shadow-sm hover:shadow-md transition-all border-slate-300 bg-white hover:bg-slate-50"
              >
                <XIcon className="h-3.5 w-3.5 mr-1.5" />
                Stop
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleFullscreen}
            className="h-8 text-xs font-semibold shadow-sm hover:shadow-md transition-all border-slate-300 bg-white hover:bg-slate-50"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

