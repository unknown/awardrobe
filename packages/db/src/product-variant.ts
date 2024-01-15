import { and, eq, inArray, sql } from "drizzle-orm";

import { VariantAttribute, VariantDetails } from "@awardrobe/adapters";

import { findCollection } from "./collection";
import { db } from "./db";
import { productVariants } from "./schema/product-variants";
import { products } from "./schema/products";
import { ProductVariant } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

export type CreateProductVariantOptions = {
  productId: number;
  externalProductVariantId: string;
  variantAttributes: VariantAttribute[];
};

export async function createProductVariant(
  options: CreateProductVariantOptions,
): Promise<ProductVariant> {
  const { productId, externalProductVariantId, variantAttributes } = options;

  const productVariantsTable = await db.insert(productVariants).values({
    productId,
    externalProductVariantId,
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
      externalProductVariantId: variantInfo.variantId,
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
  externalProductVariantId: string;
  variantAttributes: VariantAttribute[];
};

export async function findOrCreateProductVariant(
  options: FindOrCreateProductVariantOptions,
): Promise<ProductVariant> {
  const { productId, externalProductVariantId } = options;

  const existing = await db.query.productVariants.findFirst({
    where: and(
      eq(productVariants.productId, productId),
      eq(productVariants.externalProductVariantId, externalProductVariantId),
    ),
  });

  if (existing) {
    return existing;
  }

  return createProductVariant(options);
}

export type FindProductVariantFromCollectionOptions = {
  collectionPublicId: string;
  attributes: VariantAttribute[];
};

export async function findProductVariantFromCollection(
  options: FindProductVariantFromCollectionOptions,
) {
  const { collectionPublicId, attributes } = options;

  const collection = await findCollection({ collectionPublicId });
  if (!collection) {
    throw new Error("Collection does not exist");
  }

  return db.query.productVariants.findFirst({
    where: and(
      inArray(
        productVariants.productId,
        db
          .selectDistinct({ productId: products.id })
          .from(products)
          .where(eq(products.collectionId, collection.id)),
      ),
      sql`${productVariants.attributes} = cast(${JSON.stringify(attributes)} as json)`,
    ),
    with: { product: true },
  });
}
