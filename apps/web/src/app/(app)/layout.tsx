import { Suspense } from "react";

import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { UserAccountNav } from "@/components/UserAccountNav";

interface ProductLayout {
  children: React.ReactNode;
}

export default async function ProductLayout({ children }: ProductLayout) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <NavBar homePath="/home" />
          <Suspense>
            <UserAccountNav />
          </Suspense>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer className="border-t" />
    </div>
  );
}
