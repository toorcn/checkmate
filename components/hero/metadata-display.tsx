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
            className="text-primary hover:underline break-all"
          >
            {metadata.originalUrl}
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
