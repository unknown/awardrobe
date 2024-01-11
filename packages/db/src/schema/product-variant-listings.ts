import { relations } from "drizzle-orm";
import { boolean, int, mysqlTable, serial, text, unique } from "drizzle-orm/mysql-core";

import { prices } from "./prices";
import { productVariants } from "./product-variants";
import { storeListings } from "./store-listings";

export const productVariantListings = mysqlTable(
  "productVariantListings",
  {
    id: serial("id").primaryKey(),
    storeListingId: int("storeListingId").notNull(),
    productVariantId: int("productVariantId").notNull(),
    latestPriceId: int("latestPriceId"),
    productUrl: text("productUrl").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (productVariantListing) => ({
    storeListingIdProductVariantIdUnq: unique("storeListingIdProductVariantIdUnq").on(
      productVariantListing.storeListingId,
      productVariantListing.productVariantId,
    ),
  }),
);

export const productVariantListingsRelations = relations(
  productVariantListings,
  ({ many, one }) => ({
    storeListing: one(storeListings, {
      relationName: "ProductVariantListingToProductListing",
      fields: [productVariantListings.storeListingId],
      references: [storeListings.id],
    }),
    productVariant: one(productVariants, {
      relationName: "ProductVariantToListings",
      fields: [productVariantListings.productVariantId],
      references: [productVariants.id],
    }),
    prices: many(prices, { relationName: "PriceToProductVariantListing" }),
    latestPrice: one(prices, {
      relationName: "LatestPriceToProductVariantListing",
      fields: [productVariantListings.latestPriceId],
      references: [prices.id],
    }),
  }),
);
