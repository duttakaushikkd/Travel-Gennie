import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
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
    <ClerkProvider>
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
                <Show when="signed-out">
                  <SignInButton>
                    <button className="rounded-md border px-3 py-1.5" type="button">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground" type="button">
                      Sign up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </nav>
            </header>
            {children}
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
