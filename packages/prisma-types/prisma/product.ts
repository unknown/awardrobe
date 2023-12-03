import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

export async function findProductsWithLatestPrice() {
  return await prisma.product.findMany({
    include: {
      variants: { include: { latestPrice: true } },
      store: true,
    },
  });
}

export async function findFollowingProducts(userId: string) {
  return await prisma.product.findMany({
    include: { store: true },
    where: { variants: { some: { notifications: { some: { userId } } } } },
  });
}

const productWithVariants = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { variants: true, store: true },
});
export type ProductWithVariants = Prisma.ProductGetPayload<typeof productWithVariants>;

export async function findProductWithVariants(productId: string) {
  return await prisma.product.findUnique({
    ...productWithVariants,
    where: { id: productId },
  });
}
