import { Fragment, Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@ui/Skeleton";

import { PageControls } from "@/components/HomepageControls";
import { HomeProductList } from "@/components/product/list/HomeProductList";
import { isPage, Page, Pages } from "./types";

export default async function HomePage() {
  const cookiesStore = cookies();
  const cookiesPage = cookiesStore.get("page")?.value;
  const page: Page = isPage(cookiesPage) ? cookiesPage : "Featured";

  return (
    <Fragment>
      <PageControls currPage={page} pages={[...Pages]} />
      <Suspense
        key={page}
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[48px]" />
            ))}
          </div>
        }
      >
        <HomeProductList page={page} />
      </Suspense>
    </Fragment>
  );
}
