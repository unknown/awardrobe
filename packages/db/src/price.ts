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
