import { ProductList } from "@/components/ProductList";
import { prisma } from "@/utils/prisma";

export default async function ProductsPage() {
  const products = await prisma.product.findMany();

  return (
    <section className="container max-w-4xl space-y-2">
      <h1 className="text-xl font-bold">Products</h1>
      <ProductList initialProducts={products} />
    </section>
  );
}
