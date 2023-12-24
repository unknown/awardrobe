import { VariantInfo } from "@awardrobe/adapters";
import { prisma } from "@awardrobe/prisma-types";

export async function findPrices(options: { variantId: string; startDate: string }) {
  return await prisma.price.findMany({
    where: {
      productVariantId: options.variantId,
      timestamp: { gte: options.startDate },
    },
    orderBy: { timestamp: "asc" },
    take: 1000,
  });
}

export async function createLatestPrice(options: { variantId: string; variantInfo: VariantInfo }) {
  const {
    variantId,
    variantInfo: { timestamp, priceInCents, inStock },
  } = options;

  await prisma.price.create({
    data: {
      timestamp,
      priceInCents,
      inStock,
      productVariant: { connect: { id: variantId } },
      latestInProductVariant: { connect: { id: variantId } },
    },
  });
}
