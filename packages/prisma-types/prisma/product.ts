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

const productWithLatestPrice = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    variants: { include: { latestPrice: true } },
    store: true,
  },
});

export type ProductWithLatestPrice = Prisma.ProductGetPayload<typeof productWithLatestPrice>;

export async function findProductsWithLatestPrice(): Promise<ProductWithLatestPrice[]> {
  return await prisma.product.findMany({
    include: {
      variants: { include: { latestPrice: true } },
      store: true,
    },
  });
}

export async function findFollowingProducts(options: {
  userId: string;
  includeFollowingVariants?: boolean;
}) {
  const { userId, includeFollowingVariants } = options;

  return await prisma.product.findMany({
    where: { variants: { some: { notifications: { some: { userId } } } } },
    include: {
      store: true,
      variants: includeFollowingVariants
        ? {
            where: { notifications: { some: { userId } } },
          }
        : undefined,
    },
  });
}

const productWithVariants = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { variants: true, store: true },
});

export type ProductWithVariants = Prisma.ProductGetPayload<typeof productWithVariants>;

export async function findProductWithVariants(
  productId: string,
): Promise<ProductWithVariants | null> {
  return await prisma.product.findUnique({
    ...productWithVariants,
    where: { id: productId },
  });
}
