import { Suspense } from "react";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { ProductSearchbar } from "@/components/product/controls/ProductSearchbar";
import { UserAccountNav } from "@/components/UserAccountNav";

interface ProductLayout {
  children: React.ReactNode;
  params: {
    query?: string;
  };
}

export default async function ProductLayout({ children, params }: ProductLayout) {
  const query = params.query ?? "";
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex flex-1 gap-4">
            <Link href="/home" className="flex items-center">
              <span className="inline-block font-bold">Awardrobe</span>
            </Link>
          </div>
          <div className="container w-full max-w-4xl">
            <ProductSearchbar searchQuery={query} />
          </div>
          <div className="flex flex-1 justify-end">
            <Suspense>
              <UserAccountNav />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer className="border-t" />
    </div>
  );
}
