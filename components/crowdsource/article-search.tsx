/**
 * ArticleSearch - Search component for crowdsource articles
 */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArticleSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount?: number;
}

export const ArticleSearch = ({
  searchQuery,
  onSearchChange,
  resultsCount,
}: ArticleSearchProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  const handleClear = () => {
    setLocalQuery("");
    onSearchChange("");
  };

  return (
    <div className="relative flex items-center gap-2 flex-1 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search articles..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="pl-9 pr-9 h-9"
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {resultsCount !== undefined && localQuery && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resultsCount} {resultsCount === 1 ? "result" : "results"}
        </span>
      )}
    </div>
  );
};

