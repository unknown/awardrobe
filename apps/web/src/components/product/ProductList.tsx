import Link from "next/link";

import { ProductListControls } from "@/components/product/ProductListControls";

export type ProductListProps = {
  products: { id: string; name: string }[];
};

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="flex flex-col gap-1">
      <ProductListControls />
      {products.map((product) => {
        return (
          <Link key={product.id} href={`/product/${product.id}`}>
            {product.name}
          </Link>
        );
      })}
    </div>
  );
}
