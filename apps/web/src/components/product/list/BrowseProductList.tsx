import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

import { meilisearch, Product } from "@awardrobe/meilisearch-types";

import { ProductList } from "./ProductList";

type BrowseProductListProps = {
  search: string;
  page: number;
};

export async function BrowseProductList({ search, page }: BrowseProductListProps) {
  const searchResponse = await meilisearch
    .index("products")
    .search(search, { page, hitsPerPage: 24 });

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
              <Link key={page} href={`/browse?search=${search}&page=${page}`}>
                {pageButton}
              </Link>
            );
          })}
        </div>
      ) : null}
    </Fragment>
  );
}
