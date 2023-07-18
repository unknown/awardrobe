import { ProductList } from "@/components/product/ProductList";
import meilisearch from "@/utils/meilisearch";

type BrowsePageProps = {
  searchParams: { search?: string };
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { search } = searchParams;

  const response = await meilisearch.index("products").search(search ?? "");

  // TODO: better types
  const products = response.hits as { id: string; name: string }[];

  return (
    <section className="container max-w-4xl space-y-2">
      <h1 className="text-xl font-bold">Products</h1>
      <ProductList products={products} />
    </section>
  );
}
