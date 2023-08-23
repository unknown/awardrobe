import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

import { meilisearch, Product } from "@awardrobe/meilisearch-types";

import { ProductList } from "@/components/product/ProductList";
import { ProductListControls } from "@/components/product/ProductListControls";

type BrowsePageProps = {
  searchParams: {
    search?: string;
    page?: string;
  };
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const search = searchParams.search ?? "";
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const searchResponse = await meilisearch
    .index("products")
    .search(search, { page, hitsPerPage: 24 });
  const products = searchResponse.hits as Product[];

  return (
    <section className="container max-w-4xl space-y-4">
      <h1 className="text-xl font-bold">Browse</h1>
      <ProductListControls searchQuery={search} />
      <ProductList products={products} />
      {searchResponse.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          {[...Array(searchResponse.totalPages).keys()].map((index) => {
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
    </section>
  );
}
