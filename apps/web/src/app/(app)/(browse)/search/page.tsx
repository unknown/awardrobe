import { Fragment, Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@ui/Button";
import { Skeleton } from "@ui/Skeleton";

import { Product, searchProducts } from "@awardrobe/meilisearch-types";

import { ProductSearchbar } from "@/components/product/controls/ProductListControls";
import { ProductList } from "@/components/product/list/ProductList";

type SearchPageProps = {
  searchParams: {
    q?: string;
    page?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? "";
  const page = Number(searchParams.page) || 1;

  return (
    <Fragment>
      <ProductSearchbar searchQuery={query} />
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

type BrowseProductListProps = {
  query: string;
  page: number;
};

async function SearchProductList({ query, page }: BrowseProductListProps) {
  const searchResponse = await searchProducts({
    page,
    query,
    hitsPerPage: 24,
  });

  const numPages = 5;
  const pageMiddle = Math.max(
    1 + Math.floor(numPages / 2),
    Math.min(searchResponse.totalPages - Math.floor(numPages / 2), page),
  );
  const pageStart = Math.max(1, pageMiddle - Math.floor(numPages / 2));
  const pageEnd = Math.min(searchResponse.totalPages, pageMiddle + Math.floor(numPages / 2));

  return (
    <Fragment>
      <ProductList products={searchResponse.hits as Product[]} />
      {searchResponse.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href={`/search?q=${query}&page=${Math.max(1, page - 1)}`}
          >
            Previous
          </Link>
          {pageStart > 1 ? <span className="px-2">...</span> : null}
          {[...Array(pageEnd - pageStart + 1)].map((_, index) => {
            const page = pageStart + index;
            const isCurrentPage = page === searchResponse.page;
            return (
              <Link
                className={buttonVariants({
                  variant: isCurrentPage ? "outline" : "ghost",
                  size: "sm",
                })}
                key={page}
                href={`/search?q=${query}&page=${page}`}
              >
                {page}
              </Link>
            );
          })}
          {pageEnd < searchResponse.totalPages ? <span className="px-2">...</span> : null}
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href={`/search?q=${query}&page=${Math.min(searchResponse.totalPages, page + 1)}`}
          >
            Next
          </Link>
        </div>
      ) : null}
    </Fragment>
  );
}
