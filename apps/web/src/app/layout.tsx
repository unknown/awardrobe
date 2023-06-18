import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";

import { LoginButton, LogoutButton } from "@/components/AuthButtons";
import { NavBar } from "@/components/NavBar";
import "@/styles/globals.css";
import { authOptions } from "@/utils/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Price Monitor",
  description:
    "A small-scale tool to help users keep track of the online goods they've been eyeing.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="container">
            <div className="flex items-center justify-between py-4">
              <NavBar />
              {session ? <LogoutButton /> : <LoginButton />}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
