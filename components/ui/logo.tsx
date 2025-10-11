import React from "react";
import Link from "next/link";
import { SearchCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Whether to show the text label alongside the icon
   * @default true
   */
  showText?: boolean;
  /**
   * Size variant for the logo
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Whether the logo should be clickable (wrapped in Link)
   * @default true
   */
  clickable?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Custom href for the link (only used when clickable is true)
   * @default "/"
   */
  href?: string;
}

export function Logo({
  showText = true,
  size = "default",
  clickable = true,
  className,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "gap-2",
      icon: "h-4 w-4",
      iconContainer: "h-7 w-7",
      text: "text-base",
      dot: "h-1 w-1",
    },
    default: {
      container: "gap-3",
      icon: "h-5 w-5",
      iconContainer: "h-9 w-9",
      text: "text-lg",
      dot: "h-1.5 w-1.5",
    },
    lg: {
      container: "gap-4",
      icon: "h-6 w-6",
      iconContainer: "h-11 w-11",
      text: "text-xl",
      dot: "h-2 w-2",
    },
  };

  const currentSize = sizeClasses[size];

  const logoContent = (
    <div className={cn("group flex items-center", currentSize.container, className)}>
      {/* Modern minimal icon */}
      <div
        className={cn(
          "relative grid place-items-center rounded-lg border border-[#C1025C]/20 bg-gradient-to-br from-[#C1025C]/5 to-[#A0014A]/5 backdrop-blur-sm transition-colors duration-200 group-hover:border-[#C1025C]/30",
          currentSize.iconContainer
        )}
      >
        <SearchCheck
          className={cn(
            currentSize.icon,
            "text-foreground transition-colors duration-200 group-hover:text-[#C1025C]"
          )}
        />
        {/* subtle accent glow */}
        <span className="pointer-events-none absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-[#C1025C]/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>

      {/* Wordmark with a tiny accent dot */}
      {showText && (
        <span className={cn("flex items-center gap-2 font-semibold tracking-tight text-foreground", currentSize.text)}>
          Checkmate
          <span
            className={cn(
              "rounded-full bg-gradient-to-r from-[#C1025C] to-[#A0014A]",
              // @ts-ignore - size-specific dot exists per mapping
              currentSize.dot
            )}
          />
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-[#C1025C] focus:ring-offset-2 rounded-lg">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
