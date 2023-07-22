import { Inter } from "next/font/google";

import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Awardrobe",
  description: "Track prices and set alerts while building your wardrobe.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://getawardrobe.com",
    title: "Awardrobe — Shopping for clothes made simple",
    description: "Track prices and set alerts while building your wardrobe.",
    siteName: "Awardrobe",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <head />
      <body className="bg-background min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
