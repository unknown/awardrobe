import { and, asc, eq, gte } from "drizzle-orm";

import { VariantInfo } from "@awardrobe/adapters";

import { db } from "./db";
import { prices } from "./schema/prices";
import { productVariants } from "./schema/product-variants";
import { Price, Public } from "./schema/types";

export type FindPriceOptions = {
  variantPublicId: string;
  startDate: Date;
};

// TODO: extra query to get the variant
export async function findPublicPrices(options: FindPriceOptions): Promise<Public<Price>[]> {
  const { variantPublicId, startDate } = options;

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.publicId, variantPublicId),
  });

  if (!variant) {
    throw new Error("Product variant does not exist");
  }

  return db.query.prices.findMany({
    where: and(eq(prices.productVariantId, variant.id), gte(prices.timestamp, startDate)),
    columns: { id: false, productVariantId: false },
    orderBy: asc(prices.timestamp),
    limit: 1000,
  });
}

export type CreateLatestPriceOptions = {
  variantId: number;
  variantInfo: VariantInfo;
};

export async function createLatestPrice(options: CreateLatestPriceOptions): Promise<Price> {
  const {
    variantId,
    variantInfo: { timestamp, priceInCents, inStock },
  } = options;

  const pricesTable = await db.insert(prices).values({
    timestamp,
    priceInCents,
    inStock,
    productVariantId: variantId,
  });

  const created = await db.query.prices.findFirst({
    where: eq(prices.id, Number(pricesTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create price");
  }

  await db
    .update(productVariants)
    .set({
      latestPriceId: created.id,
    })
    .where(eq(productVariants.id, variantId));

  return created;
}
