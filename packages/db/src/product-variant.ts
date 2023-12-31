import { eq } from "drizzle-orm";

import { VariantInfo } from "@awardrobe/adapters";

import { db } from "./db";
import { productVariants } from "./schema/product-variants";
import { ProductVariant } from "./schema/types";

export type CreateProductVariantOptions = {
  productId: number;
  variantInfo: VariantInfo;
};

export async function createProductVariant(
  options: CreateProductVariantOptions,
): Promise<ProductVariant> {
  const {
    productId,
    variantInfo: { attributes, productUrl },
  } = options;

  const productVariantsTable = await db.insert(productVariants).values({
    productId,
    attributes,
    productUrl,
  });

  const created = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, Number(productVariantsTable.insertId)),
    with: {
      prices: true,
    },
  });

  if (!created) {
    throw new Error("Could not create product variant");
  }

  return created;
}
