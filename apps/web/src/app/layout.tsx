import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/ThemeProvider";

import "@/styles/globals.css";

import { cache } from "react";
import { headers } from "next/headers";
import { Toaster } from "@ui/Toaster";

import { TRPCReactProvider } from "@/trpc/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL("https://awardrobe.co"),
  title: "Awardrobe",
  description: "Track prices and set alerts while building your wardrobe.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://awardrobe.co",
    title: "Awardrobe — Shopping for clothes made simple",
    description: "Track prices and set alerts while building your wardrobe.",
    siteName: "Awardrobe",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const getHeaders = cache(async () => headers());

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="bg-background min-h-screen font-sans antialiased">
        <ThemeProvider attribute="class" enableSystem>
          <TRPCReactProvider headersPromise={getHeaders()}>{children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
