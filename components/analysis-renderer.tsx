import React from "react";
import { type OriginTracingResult } from "@/lib/analysis/parseOriginTracing";

// parsing moved to lib/analysis/parseOriginTracing

/**
 * AnalysisRenderer - Enhanced component to render markdown-like analysis content
 *
 * Supported heading formats:
 * - # Heading 1 (h1 - text-2xl)
 * - ## Heading 2 (h2 - text-xl)
 * - ### Heading 3 (h3 - text-lg)
 * - #### Heading 4 (h4 - text-base)
 * - ##### Heading 5 (h5 - text-sm font-medium)
 * - ###### Heading 6 (h6 - text-sm)
 * - **Legacy Header:** (converted to h3)
 *
 * Also supports:
 * - **Bold text**
 * - *Italic text*
 * - `Code snippets`
 * - [Links](https://example.com)
 * - - Bullet points
 * - - **Sub-headers:** with content
 */
// type DiagramData = OriginTracingResult & { claim?: string; allLinks?: Array<{ url: string; title?: string }> };

export function AnalysisRenderer({ content }: { content: string }) {
  // Diagram rendering moved to hero section. This component now strictly renders analysis text content.

  // Guard against null/empty content after hooks are declared
  const isEmpty =
    !content || typeof content !== "string" || content.trim() === "";
  if (isEmpty) {
    return null;
  }

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements = [];
    let currentSection = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines at the beginning of sections
      if (!trimmedLine && currentSection.length === 0) {
        continue;
      }

      // Check for markdown-style headers (# ## ### etc.)
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // Process any accumulated content before this header
        if (currentSection.length > 0) {
          elements.push(
            <div key={`section-${i}`} className="mb-6">
              {renderSectionContent(currentSection.join("\n"))}
            </div>
          );
          currentSection = [];
        }

        // Render the header
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        elements.push(renderHeader(headerText, level, `header-${i}`));
        continue;
      }

      // Check for legacy **Header:** format
      const legacyHeaderMatch = trimmedLine.match(/^\*\*([^*]+):\*\*$/);
      if (legacyHeaderMatch) {
        // Process any accumulated content before this header
        if (currentSection.length > 0) {
          elements.push(
            <div key={`section-${i}`} className="mb-6">
              {renderSectionContent(currentSection.join("\n"))}
            </div>
          );
          currentSection = [];
        }

        // Render as h3 by default for legacy format
        elements.push(
          renderHeader(legacyHeaderMatch[1], 3, `legacy-header-${i}`)
        );
        continue;
      }

      // Accumulate regular content (preserve empty lines for paragraph breaks)
      currentSection.push(line);
    }

    // Process any remaining content
    if (currentSection.length > 0) {
      elements.push(
        <div key="final-section" className="mb-4">
          {renderSectionContent(currentSection.join("\n"))}
        </div>
      );
    }

    return elements.length > 0 ? elements : renderParagraphs(text);
  };

  const renderHeader = (text: string, level: number, key: string) => {
    const baseClasses = "font-semibold text-foreground leading-tight";
    const levelClasses: Record<number, string> = {
      1: "text-2xl mb-4 mt-6", // h1
      2: "text-xl mb-4 mt-5", // h2
      3: "text-lg mb-3 mt-4", // h3
      4: "text-base mb-3 mt-3", // h4
      5: "text-sm font-medium mb-2 mt-2", // h5
      6: "text-sm mb-2 mt-2", // h6
    };

    const className = `${baseClasses} ${
      levelClasses[level] || levelClasses[4]
    }`;

    switch (level) {
      case 1:
        return (
          <h1 key={key} className={className}>
            {renderText(text)}
          </h1>
        );
      case 2:
        return (
          <h2 key={key} className={className}>
            {renderText(text)}
          </h2>
        );
      case 3:
        return (
          <h3 key={key} className={className}>
            {renderText(text)}
          </h3>
        );
      case 4:
        return (
          <h4 key={key} className={className}>
            {renderText(text)}
          </h4>
        );
      case 5:
        return (
          <h5 key={key} className={className}>
            {renderText(text)}
          </h5>
        );
      case 6:
        return (
          <h6 key={key} className={className}>
            {renderText(text)}
          </h6>
        );
      default:
        return (
          <h4 key={key} className={className}>
            {renderText(text)}
          </h4>
        );
    }
  };

  const renderSectionContent = (content: string) => {
    // Split content into paragraphs, preserving empty lines
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
    const elements = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      const lines = paragraph.split("\n");

      // Check if this paragraph is a list
      const isListParagraph = lines.every(
        (line) =>
          !line.trim() ||
          line.trim().startsWith("- ") ||
          line.trim().startsWith("* ")
      );

      if (
        isListParagraph &&
        lines.some(
          (line) => line.trim().startsWith("- ") || line.trim().startsWith("* ")
        )
      ) {
        // Render as a list
        const listItems = lines.filter(
          (line) => line.trim().startsWith("- ") || line.trim().startsWith("* ")
        );
        elements.push(
          <ul key={`list-${i}`} className="space-y-2 mb-4">
            {listItems.map((line, idx) => {
              const text = line.replace(/^[\s]*[-*]\s*/, "");

              // Check for sub-header format
              if (text.includes("**") && text.includes(":**")) {
                const match = text.match(/\*\*([^*]+):\*\*(.*)/);
                if (match) {
                  return (
                    <li key={idx} className="flex flex-col gap-1">
                      <div className="font-medium text-sm text-foreground">
                        {renderText(match[1])}
                      </div>
                      <div className="text-sm leading-relaxed text-muted-foreground pl-3">
                        {renderText(match[2].trim())}
                      </div>
                    </li>
                  );
                }
              }

              return (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1.5 text-xs leading-none">
                    •
                  </span>
                  <div className="flex-1 text-sm leading-relaxed">
                    {renderText(text)}
                  </div>
                </li>
              );
            })}
          </ul>
        );
      } else {
        // Render as regular paragraph(s)
        const cleanParagraph = lines.join(" ").trim();
        if (cleanParagraph) {
          elements.push(
            <p
              key={`para-${i}`}
              className="mb-4 text-sm leading-relaxed text-foreground"
            >
              {renderText(cleanParagraph)}
            </p>
          );
        }
      }
    }

    return elements.length > 0 ? elements : null;
  };

  const renderParagraphs = (text: string) => {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

    if (paragraphs.length <= 1) {
      // Single paragraph - handle line breaks within it
      const singlePara = text.trim();
      if (!singlePara) return null;

      return (
        <p className="text-sm leading-relaxed text-foreground">
          {renderText(singlePara)}
        </p>
      );
    }

    return paragraphs.map((paragraph, index) => {
      const cleanParagraph = paragraph.trim().replace(/\n+/g, " ");
      return (
        <p
          key={index}
          className="mb-4 last:mb-0 text-sm leading-relaxed text-foreground"
        >
          {renderText(cleanParagraph)}
        </p>
      );
    });
  };

  const renderText = (text: string): React.ReactNode => {
    if (!text || typeof text !== "string") return text;

    const parts: React.ReactNode[] = [];
    const remaining = text.trim();
    let keyCounter = 0;

    // Combined regex for all inline elements - improved to handle edge cases
    const markdownRegex =
      /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\n\s]+)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = markdownRegex.exec(remaining)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textBefore = remaining.substring(lastIndex, match.index);
        if (textBefore) {
          parts.push(textBefore);
        }
      }

      const fullMatch = match[1];
      const boldText = match[2];
      const italicText = match[3];
      const codeText = match[4];
      const linkText = match[5];
      const linkUrl = match[6];

      if (boldText) {
        parts.push(
          <strong
            key={`bold-${keyCounter++}`}
            className="font-semibold text-foreground"
          >
            {boldText}
          </strong>
        );
      } else if (italicText) {
        parts.push(
          <em key={`italic-${keyCounter++}`} className="italic text-foreground">
            {italicText}
          </em>
        );
      } else if (codeText) {
        parts.push(
          <code
            key={`code-${keyCounter++}`}
            className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground break-all"
          >
            {codeText}
          </code>
        );
      } else if (linkText && linkUrl) {
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline font-medium break-words"
            title={linkUrl}
          >
            {linkText}
          </a>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < remaining.length) {
      const remainingText = remaining.substring(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    return parts.length > 0 ? (
      <span className="break-words">{parts}</span>
    ) : (
      <span className="break-words">{text}</span>
    );
  };

  return (
    <div className="prose prose-sm max-w-none">
      <div className="space-y-1">{renderContent(content)}</div>
    </div>
  );
}
