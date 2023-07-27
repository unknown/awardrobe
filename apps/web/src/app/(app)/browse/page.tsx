import Link from "next/link";
import { Button } from "@ui/Button";

import { meilisearch, Product } from "@awardrobe/meilisearch-types";

import { ProductList } from "@/components/product/ProductList";

type BrowsePageProps = {
  searchParams: { search?: string; page?: string };
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const search = searchParams.search ?? "";
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const response = await meilisearch
    .index("products")
    .search(search ?? "", { hitsPerPage: 24, page: page ?? 1 });
  const products = response.hits as Product[];

  return (
    <section className="container max-w-4xl space-y-2">
      <h1 className="text-xl font-bold">Products</h1>
      <ProductList products={products} />
      <div className="flex gap-2">
        {response.totalPages > 1
          ? [...Array(response.totalPages).keys()].map((index) => {
              const page = index + 1;
              const isCurrentPage = page === response.page;
              if (isCurrentPage) {
                return (
                  <Button key={page} className="tabular-nums" variant="outline" size="sm" disabled>
                    {page}
                  </Button>
                );
              }
              return (
                <Link key={page} href={`/browse?page=${page}`}>
                  <Button className="tabular-nums" variant="outline" size="sm">
                    {page}
                  </Button>
                </Link>
              );
            })
          : null}
      </div>
    </section>
  );
}
