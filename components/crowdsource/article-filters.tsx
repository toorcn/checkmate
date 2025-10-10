/**
 * ArticleFilters - Filter component for crowdsource articles
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export interface FilterOptions {
  verdict: string;
  source: string;
}

interface ArticleFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableSources: string[];
}

export const ArticleFilters = ({
  filters,
  onFiltersChange,
  availableSources,
}: ArticleFiltersProps) => {
  const hasActiveFilters = filters.verdict !== "all" || filters.source !== "all";

  const handleReset = () => {
    onFiltersChange({ verdict: "all", source: "all" });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      {/* Verdict Filter */}
      <Select
        value={filters.verdict}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, verdict: value })
        }
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="All Verdicts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Verdicts</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="misleading">Misleading</SelectItem>
          <SelectItem value="false">False</SelectItem>
          <SelectItem value="unverifiable">Unverifiable</SelectItem>
          <SelectItem value="opinion">Opinion</SelectItem>
          <SelectItem value="needs-context">Needs Context</SelectItem>
        </SelectContent>
      </Select>

      {/* Source Filter */}
      <Select
        value={filters.source}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, source: value })
        }
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {availableSources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-9 gap-2"
        >
          <X className="h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
};

