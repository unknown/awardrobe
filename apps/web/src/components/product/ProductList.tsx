import Link from "next/link";

import { Product } from "@awardrobe/meilisearch-types";

export type ProductListProps = {
  products: Product[];
};

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-center">No matching products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => {
        return (
          <Link key={product.id} href={`/product/${product.id}`}>
            <div className="h-full rounded-md border p-4 md:p-3">
              <p className="text-muted-foreground text-sm">{product.storeName}</p>
              <p>{product.name}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
