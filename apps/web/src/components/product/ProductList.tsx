import { Fragment } from "react";
import Link from "next/link";

import { Product } from "@awardrobe/meilisearch-types";

import { ProductListControls } from "@/components/product/ProductListControls";

export type ProductListProps = {
  products: Product[];
};

export function ProductList({ products }: ProductListProps) {
  return (
    <Fragment>
      <ProductListControls />
      {products.length === 0 ? (
        <p className="text-center">No matching products found.</p>
      ) : (
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
      )}
    </Fragment>
  );
}
