import { VariantInfo } from "@awardrobe/adapters";
import { Prisma, prisma, Product } from "@awardrobe/prisma-types";

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
          data: variants.map(({ attributes, productUrl }) => ({ attributes, productUrl })),
        },
      },
    },
    include: { store: true, variants: true },
  });
}

export type FindProductOptions = {
  numNotified?: { gte?: number; lte?: number };
};

export async function findProducts(options: FindProductOptions = {}): Promise<Product[]> {
  const { numNotified } = options;

  return await prisma.product.findMany({
    where: { numNotified },
  });
}

export type FindFeaturedProductsOptions = {
  limit?: number;
};

export async function findFeaturedProducts(options: FindFeaturedProductsOptions = {}) {
  const { limit = 24 } = options;

  return await prisma.product.findMany({
    orderBy: { numNotified: "desc" },
    include: { store: true },
    take: limit,
  });
}

const productWithLatestPrice = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    variants: { include: { latestPrice: true } },
    store: true,
  },
});

export type ProductWithLatestPrice = Prisma.ProductGetPayload<typeof productWithLatestPrice>;

export async function findProductWithLatestPrice(
  productId: string,
): Promise<ProductWithLatestPrice | null> {
  return await prisma.product.findUnique({
    ...productWithLatestPrice,
    where: { id: productId },
  });
}

export async function findProductsByProductCodes(options: {
  productCodes: string[];
  storeHandle: string;
}) {
  const { productCodes, storeHandle } = options;

  return await prisma.product.findMany({
    where: {
      productCode: { in: productCodes },
      store: { handle: storeHandle },
    },
  });
}

export async function findProductByProductCode(options: {
  productCode: string;
  storeHandle: string;
}) {
  const { productCode, storeHandle } = options;

  return await prisma.product.findFirst({
    where: {
      productCode,
      store: { handle: storeHandle },
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
