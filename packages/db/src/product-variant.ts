import { VariantInfo } from "@awardrobe/adapters";
import { prisma } from "@awardrobe/prisma-types";

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
