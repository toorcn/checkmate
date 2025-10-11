import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";
import Providers from "@/components/Providers";
import { GlobalTranslationProvider } from "@/components/global-translation-provider";
import { TranslationStatusIndicator } from "@/components/translation-status-indicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Checkmate - Voice of Truth at the speed of thought",
  description:
    "Verify content with AI-powered fact-checking. Transcribe, analyze, and get credibility reports for social media videos, articles, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <GlobalTranslationProvider>
            <Header />
            {children}
            <TranslationStatusIndicator />
            <Toaster richColors />
          </GlobalTranslationProvider>
        </Providers>
      </body>
    </html>
  );
}
