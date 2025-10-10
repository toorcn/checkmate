"use client";

import { Metadata } from "@/types/analysis";

interface MetadataDisplayProps {
  metadata: Metadata;
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  return (
    <div className="border-b pb-4">
      <h3 className="font-semibold text-lg mb-2 break-words">
        {metadata.title}
      </h3>
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="break-words">
          <span className="font-medium">Creator:</span> {metadata.creator}
        </p>
        <p>
          <span className="font-medium">Platform:</span>{" "}
          {metadata.platform || "Unknown"}
        </p>
        <p className="break-all">
          <span className="font-medium">Original URL:</span>{" "}
            <a
            href={metadata.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            </a>
        </p>
        {metadata.description &&
          metadata.description !== metadata.title && (
            <p className="break-words">
              <span className="font-medium">Description:</span>{" "}
              {metadata.description}
            </p>
          )}
      </div>
    </div>
  );
}
