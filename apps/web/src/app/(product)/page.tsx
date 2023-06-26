import Link from "next/link";

import { AddProductForm } from "@/components/AddProductForm";
import { prisma } from "@/utils/prisma";

export default async function Home() {
  const products = await prisma.product.findMany();

  return (
    <section className="container space-y-2">
      <h1 className="text-xl font-bold">Products</h1>
      <AddProductForm />
      <div className="flex flex-col gap-1">
        {products.map((product) => {
          return (
            <Link key={product.id} href={`/product/${product.id}`}>
              {product.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
