import { and, eq, inArray, sql } from "drizzle-orm";

import { VariantInfo } from "@awardrobe/adapters";

import { db } from "./db";
import { createLatestPrice } from "./price";
import { productVariants } from "./schema/product-variants";
import { ProductVariant, ProductVariantWithPrice } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

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
    publicId: generatePublicId(),
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

export type CreateProductVariantsOptions = {
  productId: number;
  variantInfos: VariantInfo[];
};

export async function createProductVariants(options: CreateProductVariantsOptions): Promise<void> {
  const { productId, variantInfos } = options;

  await db.insert(productVariants).values(
    variantInfos.map((variantInfo) => ({
      productId,
      publicId: generatePublicId(),
      attributes: variantInfo.attributes,
      productUrl: variantInfo.productUrl,
    })),
  );

  const created = await db.query.productVariants.findMany({
    where: (productVariants) =>
      and(
        eq(productVariants.productId, productId),
        inArray(
          sql`${productVariants.attributes}`,
          variantInfos.map((v) => sql`cast(${JSON.stringify(v.attributes)} as json)`),
        ),
      ),
  });

  await Promise.all(
    created.map((productVariant) => {
      // TODO: hacky toString comparison
      const variantInfo = variantInfos.find(
        (v) => v.attributes.toString() === productVariant.attributes.toString(),
      );
      if (!variantInfo) {
        // TODO: log error
        return;
      }
      return createLatestPrice({
        variantInfo,
        variantId: productVariant.id,
      });
    }),
  );
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
