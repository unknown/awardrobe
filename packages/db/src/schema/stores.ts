import { relations } from "drizzle-orm";
import { mysqlTable, serial, text, unique, varchar } from "drizzle-orm/mysql-core";

import { products } from "./products";

export const stores = mysqlTable(
  "store",
  {
    id: serial("id").primaryKey(),
    handle: varchar("handle", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    shortenedName: varchar("shortenedName", { length: 255 }).notNull(),
    externalUrl: text("externalUrl").notNull(),
  },
  (store) => ({
    handleUnq: unique("handleUnq").on(store.handle),
  }),
);

export const storesRelations = relations(stores, ({ many }) => {
  return { products: many(products, { relationName: "ProductToStore" }) };
});