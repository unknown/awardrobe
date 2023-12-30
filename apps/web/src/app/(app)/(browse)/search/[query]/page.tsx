import { Fragment, Suspense } from "react";
import { Skeleton } from "@ui/Skeleton";

import { SearchProductList } from "@/components/product/list/SearchProductList";

type SearchPageProps = {
  params: {
    query: string;
  };
  searchParams: {
    page?: string;
  };
};

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const query = params.query ?? "";
  const page = Number(searchParams.page) || 1;

  return (
    <Fragment>
      <Suspense
        key={`${query}-${page}`}
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[48px]" />
            ))}
          </div>
        }
      >
        <SearchProductList query={query} page={page} />
      </Suspense>
    </Fragment>
  );
}
