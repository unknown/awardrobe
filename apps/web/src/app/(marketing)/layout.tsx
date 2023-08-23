import Link from "next/link";
import { Button } from "@ui/Button";

import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";

interface MarketingLayout {
  children: React.ReactNode;
}

export default async function MarketingLayout({ children }: MarketingLayout) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background z-10">
        <div className="container flex h-20 items-center justify-between py-4">
          <NavBar />
          <Link href="/login">
            <Button variant="secondary">Login</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
