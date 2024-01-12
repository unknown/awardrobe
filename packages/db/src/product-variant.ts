import { and, eq, inArray, sql } from "drizzle-orm";

import { VariantAttribute, VariantDetails } from "@awardrobe/adapters";

import { db } from "./db";
import { productVariants } from "./schema/product-variants";
import { ProductVariant } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

export type CreateProductVariantOptions = {
  productId: number;
  variantAttributes: VariantAttribute[];
};

export async function createProductVariant(
  options: CreateProductVariantOptions,
): Promise<ProductVariant> {
  const { productId, variantAttributes } = options;

  const productVariantsTable = await db.insert(productVariants).values({
    productId,
    publicId: generatePublicId(),
    attributes: variantAttributes,
  });

  const created = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, Number(productVariantsTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create product variant");
  }

  return created;
}

export type CreateProductVariantsOptions = {
  productId: number;
  variants: VariantDetails[];
};

export async function createProductVariants(options: CreateProductVariantsOptions): Promise<void> {
  const { productId, variants } = options;

  await db.insert(productVariants).values(
    variants.map((variantInfo) => ({
      productId,
      publicId: generatePublicId(),
      attributes: variantInfo.attributes,
      productUrl: variantInfo.productUrl,
    })),
  );
}

export type FindProductVariants = {
  productId: number;
};

export function findProductVariants(options: FindProductVariants): Promise<ProductVariant[]> {
  const { productId } = options;

  return db.query.productVariants.findMany({
    where: eq(productVariants.productId, productId),
  });
}

export type FindOrCreateProductVariantOptions = {
  productId: number;
  variantAttributes: VariantAttribute[];
};

export async function findOrCreateProductVariant(
  options: FindOrCreateProductVariantOptions,
): Promise<ProductVariant> {
  const { productId, variantAttributes } = options;

  const existing = await db.query.productVariants.findFirst({
    where: and(
      eq(productVariants.productId, productId),
      sql`${productVariants.attributes} = cast(${JSON.stringify(variantAttributes)} as json)`,
    ),
  });

  if (existing) {
    return existing;
  }

  return createProductVariant(options);
}
