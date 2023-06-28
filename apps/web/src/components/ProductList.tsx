"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

import { Product } from "@awardrobe/prisma-types";

import { AddProductDialog } from "./AddProductDialog";

export type ProductListProps = {
  initialProducts: Product[];
};

export function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts);

  return (
    <Fragment>
      <AddProductDialog
        onAddProduct={(newProduct) => setProducts((products) => [...products, newProduct])}
      />
      <div className="flex flex-col gap-1">
        {products.map((product) => {
          return (
            <Link key={product.id} href={`/product/${product.id}`}>
              {product.name}
            </Link>
          );
        })}
      </div>
    </Fragment>
  );
}
