import { Inter } from "next/font/google";
import { Toaster } from "@ui/Toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/ThemeProvider";

import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL("https://awardrobe.co"),
  title: {
    default: "Awardrobe",
    template: "%s — Awardrobe",
  },
  description: "Research price history and stock availability to save money.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://awardrobe.co",
    title: "Awardrobe — Shop for clothes smarter",
    description: "Research price history and stock availability to save money.",
    siteName: "Awardrobe",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="bg-background min-h-screen font-sans antialiased">
        <ThemeProvider attribute="class" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
