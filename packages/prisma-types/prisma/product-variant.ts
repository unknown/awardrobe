import { VariantAttribute, VariantInfo } from "@awardrobe/adapters";

import { prisma } from "./prisma";

export async function createLatestPrice(options: { variantId: string; variantInfo: VariantInfo }) {
  const {
    variantId,
    variantInfo: { timestamp, priceInCents, inStock },
  } = options;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      latestPrice: {
        create: {
          timestamp,
          priceInCents,
          inStock,
          productVariantId: variantId,
        },
      },
    },
  });
}

export async function createProductVariant(options: {
  productId: string;
  variantInfo: VariantInfo;
}) {
  const {
    productId,
    variantInfo: { attributes, productUrl },
  } = options;

  return await prisma.productVariant.create({
    data: {
      productId,
      attributes,
      productUrl,
    },
    include: { prices: true, latestPrice: true },
  });
}
