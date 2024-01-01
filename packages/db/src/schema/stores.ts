import { relations } from "drizzle-orm";
import { mysqlTable, serial, text, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { products } from "./products";

export const stores = mysqlTable(
  "store",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull(),
    handle: varchar("handle", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    shortenedName: varchar("shortenedName", { length: 255 }).notNull(),
    externalUrl: text("externalUrl").notNull(),
  },
  (store) => ({
    publicIdIdx: uniqueIndex("publicIdIdx").on(store.publicId),
    handleUnq: uniqueIndex("handleUnq").on(store.handle),
  }),
);

export const storesRelations = relations(stores, ({ many }) => {
  return { products: many(products, { relationName: "ProductToStore" }) };
});
