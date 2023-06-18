import { Product, ProductVariant } from "database";

import { ProductInfo } from "@/components/ProductInfo";
import { prisma } from "@/utils/prisma";

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

type ProductPageProps = {
  params: { productId: string };
};

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      variants: true,
    },
  });

  if (!product) {
    return "Product not found";
  }

  return <ProductInfo product={product} />;
}
