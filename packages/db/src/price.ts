import { eq } from "drizzle-orm";

import { PriceDatum } from "@awardrobe/adapters";

import { db } from "./db";
import { prices } from "./schema/prices";
import { productVariantListings } from "./schema/product-variant-listings";
import { Price } from "./schema/types";

export type CreateLatestPriceOptions = {
  productVariantListingId: number;
  price: PriceDatum;
};

export async function createLatestPrice(options: CreateLatestPriceOptions): Promise<Price> {
  const { productVariantListingId, price } = options;

  const priceTable = await db.insert(prices).values({
    productVariantListingId,
    inStock: price.inStock,
    priceInCents: price.priceInCents,
    timestamp: price.timestamp,
  });

  const created = await db.query.prices.findFirst({
    where: eq(prices.id, Number(priceTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create price");
  }

  await db
    .update(productVariantListings)
    .set({
      latestPriceId: created.id,
    })
    .where(eq(productVariantListings.id, productVariantListingId));

  return created;
}
