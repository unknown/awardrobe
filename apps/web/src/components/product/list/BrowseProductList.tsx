import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

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

  return (
    <Fragment>
      <ProductList products={searchResponse.hits as Product[]} />
      {searchResponse.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          {[...Array(searchResponse.totalPages)].map((_, index) => {
            const page = index + 1;
            const isCurrentPage = page === searchResponse.page;
            const pageButton = (
              <Button className="tabular-nums" variant="outline" size="sm" disabled={isCurrentPage}>
                {page}
              </Button>
            );
            if (isCurrentPage) {
              return <Fragment key={page}>{pageButton}</Fragment>;
            }
            return (
              <Link key={page} href={`/browse?q=${query}&page=${page}`}>
                {pageButton}
              </Link>
            );
          })}
        </div>
      ) : null}
    </Fragment>
  );
}
