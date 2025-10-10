/**
 * ArticleSort - Sort component for crowdsource articles
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "recent" | "votes" | "credibility" | "analyzed";

interface ArticleSortProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const ArticleSort = ({ sortBy, onSortChange }: ArticleSortProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sort</span>
      </div>
      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recent</SelectItem>
          <SelectItem value="votes">Votes</SelectItem>
          <SelectItem value="credibility">Credibility</SelectItem>
          <SelectItem value="analyzed">Analyzed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

