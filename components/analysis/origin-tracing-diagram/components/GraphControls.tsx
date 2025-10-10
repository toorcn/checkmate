'use client';

import React from 'react';
import { Button } from '../../../ui/button';
import { Pause, X as XIcon, Maximize, PanelRightClose, Expand, Minimize, Play } from 'lucide-react';

interface GraphControlsProps {
  isExpanded: boolean;
  isAnimating: boolean;
  sidebarVisible: boolean;
  previewMode?: boolean;
  isFullscreen?: boolean;
  onPauseAnimation: () => void;
  onStopAnimation: () => void;
  onStartAnimation?: () => void;
  onFitView: () => void;
  onCloseSidebar: () => void;
  onToggleFullscreen?: () => void;
}

export function GraphControls({
  isExpanded,
  isAnimating,
  sidebarVisible,
  previewMode = false,
  isFullscreen = false,
  onPauseAnimation,
  onStopAnimation,
  onStartAnimation,
  onFitView,
  onCloseSidebar,
  onToggleFullscreen,
}: GraphControlsProps) {
  return (
    <div className={isExpanded ? "p-5 border-b border-border bg-gradient-to-r from-background via-muted/50 to-background shadow-sm" : "p-4 border-b border-border bg-gradient-to-r from-background via-muted/50 to-background"}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">
              Origin Tracing Diagram
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Interactive evolution map • Click to explore
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {previewMode && onToggleFullscreen && (
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleFullscreen}
              className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-primary bg-primary/10 hover:bg-primary/20 text-primary"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-3.5 w-3.5 mr-1.5" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Expand className="h-3.5 w-3.5 mr-1.5" />
                  Fullscreen
                </>
              )}
            </Button>
          )}
          {!isAnimating && onStartAnimation && (
            <Button
              size="sm"
              variant="outline"
              onClick={onStartAnimation}
              className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-primary bg-primary/10 hover:bg-primary/20 text-primary"
              title="Start animation"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Play
            </Button>
          )}
          {isAnimating && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onPauseAnimation}
                className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-border bg-background hover:bg-muted text-foreground"
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onStopAnimation}
                className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-border bg-background hover:bg-muted text-foreground"
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
            className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-border bg-background hover:bg-muted text-foreground"
            title="Fit graph to view"
          >
            <Maximize className="h-3.5 w-3.5 mr-1.5" />
            Fit View
          </Button>
          {sidebarVisible && !previewMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCloseSidebar}
              className="h-8 text-xs font-semibold shadow-md hover:shadow-lg transition-all border-border bg-background hover:bg-muted text-foreground"
              title="Close sidebar"
            >
              <PanelRightClose className="h-3.5 w-3.5 mr-1.5" />
              Close Panel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

