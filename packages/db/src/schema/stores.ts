import { relations } from "drizzle-orm";
import { mysqlTable, serial, text, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { storeListings } from "./store-listings";

export const stores = mysqlTable(
  "store",
  {
    id: serial("id").primaryKey(),
    handle: varchar("handle", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    externalUrl: text("externalUrl").notNull(),
  },
  (store) => ({
    handleUnqIdx: uniqueIndex("handleUnqIdx").on(store.handle),
  }),
);

export const storesRelations = relations(stores, ({ many }) => ({
  productListings: many(storeListings, { relationName: "StoreToProductListing" }),
}));
