import { Fragment } from "react";
import Link from "next/link";
import { buttonVariants } from "@ui/Button";

import { Product, searchProducts } from "@awardrobe/meilisearch-types";

import { ProductList } from "./ProductList";

type BrowseProductListProps = {
  query: string;
  page: number;
};

export async function BrowseProductList({ query, page }: BrowseProductListProps) {
  const searchResponse = await searchProducts({
    page,
    query,
    hitsPerPage: 24,
  });

  const numPages = 5;
  const middle = Math.max(
    1 + Math.floor(numPages / 2),
    Math.min(searchResponse.totalPages - Math.floor(numPages / 2), page),
  );
  const pageStart = Math.max(1, middle - Math.floor(numPages / 2));
  const pageEnd = Math.min(searchResponse.totalPages, middle + Math.floor(numPages / 2));

  return (
    <Fragment>
      <ProductList products={searchResponse.hits as Product[]} />
      {searchResponse.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href={`/browse?q=${query}&page=${Math.max(1, page - 1)}`}
          >
            Previous
          </Link>
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
                href={`/browse?q=${query}&page=${page}`}
              >
                {page}
              </Link>
            );
          })}
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href={`/browse?q=${query}&page=${Math.min(searchResponse.totalPages, page + 1)}`}
          >
            Next
          </Link>
        </div>
      ) : null}
    </Fragment>
  );
}
