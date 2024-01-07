import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@ui/Skeleton";

import { PageControls } from "@/components/home/HomepageControls";
import { HomepageProvider } from "@/components/home/HomepageProvider";
import { HomepageTransition } from "@/components/home/HomepageTransition";
import { HomeProductList } from "@/components/product/list/HomeProductList";
import { isPage, Page, Pages } from "./types";

const fallback = (
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-[48px]" />
    ))}
  </div>
);

export default async function HomePage() {
  const cookiesStore = cookies();
  const cookiesPage = cookiesStore.get("page")?.value;
  const page: Page = isPage(cookiesPage) ? cookiesPage : "Featured";

  return (
    <HomepageProvider>
      <PageControls initialPage={page} pages={[...Pages]} />
      <Suspense fallback={fallback}>
        <HomepageTransition fallback={fallback}>
          <HomeProductList page={page} />
        </HomepageTransition>
      </Suspense>
    </HomepageProvider>
  );
}
