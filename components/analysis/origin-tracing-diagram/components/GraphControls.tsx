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
    <div className={isFullscreen ? "p-4 border-b bg-white" : "p-3 border-b"}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Interactive evolution diagram • Click sections to explore and animate
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAnimating && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onPauseAnimation}
                className="h-7 text-xs"
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onStopAnimation}
                className="h-7 text-xs"
              >
                <XIcon className="h-3 w-3 mr-1" />
                Stop
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleFullscreen}
            className="h-7 text-xs"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3 w-3 mr-1" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3 mr-1" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

