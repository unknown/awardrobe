import { relations } from "drizzle-orm";
import { boolean, int, mysqlTable, serial, unique, varchar } from "drizzle-orm/mysql-core";

import { productVariantListings } from "./product-variant-listings";
import { stores } from "./stores";

export const storeListings = mysqlTable(
  "storeListing",
  {
    id: serial("id").primaryKey(),
    storeId: int("storeId").notNull(),
    externalListingId: varchar("externalListingId", { length: 255 }).notNull(),
    active: boolean("active").notNull().default(true),
  },
  (storeListing) => ({
    storeIdListingIdUnq: unique("storeIdListingIdUnq").on(
      storeListing.storeId,
      storeListing.externalListingId,
    ),
  }),
);

export const productListingsRelations = relations(storeListings, ({ one, many }) => ({
  store: one(stores, {
    relationName: "StoreToProductListing",
    fields: [storeListings.storeId],
    references: [stores.id],
  }),
  productVariantListings: many(productVariantListings, {
    relationName: "ProductVariantListingToProductListing",
  }),
}));
