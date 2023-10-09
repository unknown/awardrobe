import { Fragment, Suspense } from "react";
import { Skeleton } from "@ui/Skeleton";

import { BrowseProductList } from "@/components/product/list/BrowseProductList";
import { ProductListControls } from "@/components/product/list/ProductListControls";

type BrowsePageProps = {
  searchParams: {
    search?: string;
    page?: string;
  };
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const search = searchParams.search ?? "";
  const page = Number(searchParams.page) || 1;

  const apiDateTime = await fetch("http://worldtimeapi.org/api/timezone/America/New_York")
    .then((res) => res.json())
    .then((res) => res.datetime);
  const lastDate = new Date(apiDateTime);

  return (
    <Fragment>
      <ProductListControls searchQuery={search} />
      <Suspense
        key={`${search}-${page}`}
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[48px]" />
            ))}
          </div>
        }
      >
        <BrowseProductList search={search} page={page} />
      </Suspense>
      <p className="text-muted-foreground text-center">Last updated at {lastDate.toISOString()}</p>
    </Fragment>
  );
}
