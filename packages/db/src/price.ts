import { and, asc, eq, gte } from "drizzle-orm";

import { VariantInfo } from "@awardrobe/adapters";

import { db } from "./db";
import { prices } from "./schema/prices";
import { Price } from "./schema/types";

export type FindPriceOptions = {
  variantId: number;
  startDate: Date;
};

export function findPrices(options: FindPriceOptions): Promise<Price[]> {
  const { variantId, startDate } = options;

  return db.query.prices.findMany({
    where: and(eq(prices.productVariantId, variantId), gte(prices.timestamp, startDate)),
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
    productVariantId: variantId,
    inStock,
  });

  const created = await db.query.prices.findFirst({
    where: eq(prices.id, Number(pricesTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create price");
  }

  return created;
}
