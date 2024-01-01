import { eq } from "drizzle-orm";

import { VariantInfo } from "@awardrobe/adapters";

import { db } from "./db";
import { createLatestPrice } from "./price";
import { productVariants } from "./schema/product-variants";
import { ProductVariant, ProductVariantWithPrice } from "./schema/types";

export type CreateProductVariantOptions = {
  productId: number;
  variantInfo: VariantInfo;
};

export async function createProductVariant(
  options: CreateProductVariantOptions,
): Promise<ProductVariant> {
  const { productId, variantInfo } = options;
  const { attributes, productUrl } = variantInfo;

  const productVariantsTable = await db.insert(productVariants).values({
    productId,
    attributes,
    productUrl,
  });

  const created = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, Number(productVariantsTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create product variant");
  }

  await createLatestPrice({ variantId: created.id, variantInfo });

  return created;
}

export type FindProductVariants = {
  productId: number;
};

export function findProductVariants(
  options: FindProductVariants,
): Promise<ProductVariantWithPrice[]> {
  const { productId } = options;

  return db.query.productVariants.findMany({
    where: eq(productVariants.productId, productId),
    with: {
      latestPrice: true,
    },
  });
}
