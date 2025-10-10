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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <ArrowUpDown className="h-4 w-4" />
        <span className="hidden sm:inline">Sort by:</span>
      </div>
      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="votes">Most Votes</SelectItem>
          <SelectItem value="credibility">Highest Credibility</SelectItem>
          <SelectItem value="analyzed">Most Analyzed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

