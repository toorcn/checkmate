"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PlayIcon,
  LoaderIcon,
  ClipboardIcon,
  XCircleIcon,
  ShieldIcon,
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
}

export function UrlInputForm({
  url,
  setUrl,
  isLoading,
  isMockLoading,
  onSubmit,
  onMockAnalysis,
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
    if (!url.trim()) return "Please enter a URL";
    if (!isValidUrl) return "Enter a valid URL (e.g., https://tiktok.com/...)";
    return "";
  }, [urlTouched, url, isValidUrl]);

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
    <div className="mx-auto max-w-2xl space-y-5 px-2 sm:px-4">
      <form
        onSubmit={onSubmit}
        className="flex gap-3 items-center justify-center"
      >
        <Input
          placeholder={t.urlPlaceholder}
          className={`flex-1 h-12 text-base min-w-0 break-words border-2 focus:border-primary/50 transition-colors duration-200 ${urlTouched && !isValidUrl ? "border-red-400 focus:border-red-500" : ""}`}
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (!urlTouched) setUrlTouched(true); }}
          onBlur={() => setUrlTouched(true)}
          disabled={isLoading || isMockLoading}
          aria-label="Content URL"
          aria-invalid={Boolean(urlTouched && !isValidUrl)}
          aria-describedby="url-help"
          autoFocus
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-3 h-10 shrink-0"
          onClick={handlePasteFromClipboard}
          disabled={isLoading || isMockLoading}
          aria-label="Paste URL from clipboard"
        >
          <ClipboardIcon className="h-4 w-4 mr-1" />
          Paste
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-3 h-10 shrink-0"
          onClick={handleClearUrl}
          disabled={isLoading || isMockLoading || !url}
          aria-label="Clear URL"
        >
          <XCircleIcon className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button
          type="submit"
          size="lg"
          className="px-6 h-12 shrink-0 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isLoading || isMockLoading || !isValidUrl}
          aria-label="Analyze URL"
        >
          {isLoading ? (
            <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlayIcon className="h-4 w-4 mr-2" />
          )}
          {isLoading ? t.analyzing : t.analyzeButton}
        </Button>
      </form>

      {/* Helper text & validation */}
      <div id="url-help" className="text-left">
        {urlError ? (
          <p className="text-xs text-red-600 mt-1">{urlError}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Paste a TikTok or Twitter(X) link. Example: https://www.tiktok.com/@user/video/123</p>
        )}
      </div>

      {/* Mock Analysis Button */}
      <div className="flex justify-center">
        <Button
          onClick={onMockAnalysis}
          variant="outline"
          size="sm"
          className="px-4 h-9 text-sm bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200"
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

      {/* Quick samples */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs mt-2">
        <span className="text-muted-foreground">Try a sample:</span>
        <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => handleSelectSample("https://www.tiktok.com/@scout2015/video/6718335390845095173")}>TikTok</Button>
        <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => handleSelectSample("https://x.com/3dom13/status/1630577536877961217")}>Twitter/X</Button>
        <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => handleSelectSample("https://example.com/article")}>Web</Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Try it with any TikTok/Twitter(X) video URL to see the magic happen
      </p>

      {/* Mock Demo Description */}
      <div className="text-center">
        <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/20 px-3 py-1.5 rounded-md inline-block border border-purple-200/50 dark:border-purple-800/50">
          Demo simulates full analysis with realistic data—no API costs!
        </p>
      </div>
    </div>
  );
}
