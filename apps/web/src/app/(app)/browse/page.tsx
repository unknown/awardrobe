import { meilisearch, Product } from "@awardrobe/meilisearch-types";

import { ProductList } from "@/components/product/ProductList";

type BrowsePageProps = {
  searchParams: { search?: string };
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { search } = searchParams;

  const response = await meilisearch.index("products").search(search ?? "", { limit: 100 });
  const products = response.hits as Product[];

  return (
    <section className="container max-w-4xl space-y-2">
      <h1 className="text-xl font-bold">Products</h1>
      <ProductList products={products} />
    </section>
  );
}
