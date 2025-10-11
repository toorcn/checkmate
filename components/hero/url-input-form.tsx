"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PlayIcon,
  LoaderIcon,
  ClipboardIcon,
  XCircleIcon,
  ShieldIcon,
  PlusIcon,
  MicIcon,
  GlobeIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/global-translation-provider";

interface UrlInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  isMockLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onMockAnalysis: () => void;
  compact?: boolean;
  allowNonUrl?: boolean;
  forceChat?: boolean;
  onToggleChat?: () => void;
  hideExtras?: boolean;
}

export function UrlInputForm({
  url,
  setUrl,
  isLoading,
  isMockLoading,
  onSubmit,
  onMockAnalysis,
  compact = false,
  allowNonUrl = false,
  forceChat = false,
  onToggleChat,
  hideExtras = false,
}: UrlInputFormProps) {
  const [urlTouched, setUrlTouched] = useState(false);
  const { t } = useLanguage();

  const isValidUrl = useMemo(() => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      return Boolean(u.hostname);
    } catch {
      return false;
    }
  }, [url]);

  const urlError = useMemo(() => {
    if (!urlTouched) return "";
    if (!url.trim()) return allowNonUrl ? "Please enter a URL or question" : "Please enter a URL";
    if (!isValidUrl && !allowNonUrl) return "Enter a valid URL (e.g., https://tiktok.com/...)";
    return "";
  }, [urlTouched, url, isValidUrl, allowNonUrl]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setUrlTouched(true);
      } else {
        toast.info("Clipboard is empty");
      }
    } catch {
      toast.error("Unable to read clipboard");
    }
  };

  const handleClearUrl = () => {
    setUrl("");
    setUrlTouched(false);
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setUrlTouched(true);
  };

  return (
    <div className={`mx-auto max-w-2xl ${compact ? "space-y-3" : "space-y-5"} px-2 sm:px-4`}>
      <form onSubmit={onSubmit} className="w-full">
        <div className="relative">
          {compact ? (
            <Textarea
              placeholder={t.urlPlaceholder}
              className={`w-full min-h-28 md:min-h-32 pr-14 rounded-2xl bg-background/40 border border-border/60 focus:border-primary/60 transition-colors duration-200 leading-6 ${urlTouched && !isValidUrl ? "border-destructive/60 focus:border-destructive" : ""}`}
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (!urlTouched) setUrlTouched(true); }}
              onBlur={() => setUrlTouched(true)}
              disabled={isLoading || isMockLoading}
              aria-label="Content URL"
              aria-invalid={Boolean(urlTouched && !isValidUrl)}
              aria-describedby="url-help"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && !isMockLoading && (isValidUrl || (allowNonUrl && url.trim()))) {
                    (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                  }
                }
              }}
              autoFocus
            />
          ) : (
            <Input
              placeholder={t.urlPlaceholder}
              className={`w-full h-14 pr-14 rounded-xl bg-background/40 border border-border/60 focus:border-primary/60 transition-colors duration-200 ${urlTouched && !isValidUrl ? "border-destructive/60 focus:border-destructive" : ""}`}
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (!urlTouched) setUrlTouched(true); }}
              onBlur={() => setUrlTouched(true)}
              disabled={isLoading || isMockLoading}
              aria-label="Content URL"
              aria-invalid={Boolean(urlTouched && !isValidUrl)}
              aria-describedby="url-help"
              autoFocus
            />
          )}
          {onToggleChat && (
            <Button
              type="button"
              size="icon"
              variant={forceChat ? "default" : "ghost"}
              onClick={onToggleChat}
              className={`absolute ${compact ? "right-14 top-3" : "right-14 top-1/2 -translate-y-1/2"} rounded-lg h-10 w-10`}
              aria-label="Toggle Chat Mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            className={`absolute right-2 ${compact ? "top-3" : "top-1/2 -translate-y-1/2"} rounded-lg ${compact ? "h-10 w-10" : "h-10 w-10"}`}
            disabled={isLoading || isMockLoading || (!isValidUrl && !allowNonUrl) || !url.trim()}
            aria-label="Analyze URL"
          >
            {isLoading ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {!compact && !hideExtras && (
        <div id="url-help" className="text-left">
          {urlError ? (
            <p className="text-xs text-destructive mt-1">{urlError}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              {allowNonUrl 
                ? "Enter a URL to analyze or ask a question about recent news" 
                : "Paste a TikTok or Twitter(X) link. Example: https://www.tiktok.com/@user/video/123"}
            </p>
          )}
        </div>
      )}

      {!compact && !hideExtras && (
        <div className="flex justify-center">
          <Button
            onClick={onMockAnalysis}
            variant="outline"
            size="sm"
            className="px-4 h-9 text-sm bg-muted/50 hover:bg-muted transition-all duration-200"
            disabled={isLoading || isMockLoading || !isValidUrl}
            aria-label="Run demo analysis"
          >
            {isMockLoading ? (
              <LoaderIcon className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <ShieldIcon className="h-3 w-3 mr-1.5" />
            )}
            {isMockLoading ? "Running..." : "Try Demo"}
          </Button>
        </div>
      )}

      {!compact && !hideExtras && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs mt-2">
          <span className="text-muted-foreground">Try a sample:</span>
          <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => handleSelectSample("https://www.tiktok.com/@scout2015/video/6718335390845095173")}>TikTok</Button>
          <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => handleSelectSample("https://x.com/3dom13/status/1630577536877961217")}>Twitter/X</Button>
          <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => handleSelectSample("https://example.com/article")}>Web</Button>
        </div>
      )}

      {/* toolbar row removed per dashboard design */}

      {compact && !hideExtras && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] sm:text-xs text-muted-foreground/70">
          <button
            type="button"
            className="hover:text-foreground/90 transition-colors"
            onClick={() => handleSelectSample("https://www.tiktok.com/@scout2015/video/6718335390845095173")}
          >
            Show me a TikTok analysis
          </button>
          <button
            type="button"
            className="hover:text-foreground/90 transition-colors"
            onClick={() => handleSelectSample("https://x.com/3dom13/status/1630577536877961217")}
          >
            Analyze a Twitter/X link
          </button>
          <button
            type="button"
            className="hover:text-foreground/90 transition-colors"
            onClick={() => handleSelectSample("https://example.com/article")}
          >
            Check a web article
          </button>
        </div>
      )}

      {compact && !hideExtras && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            disabled={isLoading || isMockLoading}
            onClick={() => {
              const defaultSample = url?.trim() ? url.trim() : "https://www.tiktok.com/@scout2015/video/6718335390845095173";
              if (!url?.trim()) {
                setUrl(defaultSample);
                setUrlTouched(true);
                setTimeout(() => onMockAnalysis(), 0);
              } else {
                onMockAnalysis();
              }
            }}
            aria-label="Run demo analysis"
          >
            {isMockLoading ? (
              <LoaderIcon className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <ShieldIcon className="h-3 w-3 mr-1.5" />
            )}
            {isMockLoading ? "Running Demo..." : "Run Demo"}
          </Button>
        </div>
      )}

      {!compact && !hideExtras && (
        <p className="text-sm text-muted-foreground text-center">
          Try it with any TikTok/Twitter(X) video URL to see the magic happen
        </p>
      )}

      {!compact && !hideExtras && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md inline-block border border-border/50">
            Demo simulates full analysis with realistic data—no API costs!
          </p>
        </div>
      )}
    </div>
  );
}
