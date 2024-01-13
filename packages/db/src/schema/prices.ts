import { relations } from "drizzle-orm";
import { boolean, datetime, index, int, mysqlTable, serial } from "drizzle-orm/mysql-core";

import { productVariantListings } from "./product-variant-listings";

export const prices = mysqlTable(
  "price",
  {
    id: serial("id").primaryKey(),
    productVariantListingId: int("productVariantListingId").notNull(),
    timestamp: datetime("timestamp", { mode: "date", fsp: 3 }).notNull(),
    priceInCents: int("priceInCents").notNull(),
    inStock: boolean("inStock").notNull(),
  },
  (price) => ({
    productVariantListingIdIdx: index("productVariantListingIdIdx").on(
      price.productVariantListingId,
    ),
  }),
);

export const pricesRelations = relations(prices, ({ one }) => ({
  listing: one(productVariantListings, {
    relationName: "PriceToProductVariantListing",
    fields: [prices.productVariantListingId],
    references: [productVariantListings.id],
  }),
  latestInListing: one(productVariantListings, {
    relationName: "LatestPriceToProductVariantListing",
    fields: [prices.id],
    references: [productVariantListings.latestPriceId],
  }),
}));
