import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { HeaderAuth } from "@/app/_components/header-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travel Gennie",
  description: "AI itineraries and cheapest-platform ticket handoff for India-first travel.",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html className={cn("dark", sans.variable, mono.variable)} lang="en">
      <body className="bg-background text-foreground">
        <TooltipProvider>
          <header className="flex h-14 items-center justify-between border-b px-4">
            <a className="font-medium tracking-tight" href="/">
              Travel Gennie
            </a>
            <nav className="flex items-center gap-3 text-sm">
              <a className="text-muted-foreground hover:text-foreground" href="/trips">
                Saved trips
              </a>
              <HeaderAuth />
            </nav>
          </header>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
