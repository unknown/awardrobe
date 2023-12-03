import { Prisma } from "@prisma/client";

import { VariantInfo } from "@awardrobe/adapters";

import { prisma } from "./prisma";

export async function createProduct(options: {
  name: string;
  productCode: string;
  storeHandle: string;
  variants: VariantInfo[];
}) {
  const { name, productCode, storeHandle, variants } = options;

  return await prisma.product.create({
    data: {
      name,
      productCode,
      store: { connect: { handle: storeHandle } },
      variants: {
        createMany: {
          data: variants,
        },
      },
    },
    include: { store: true },
  });
}

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
