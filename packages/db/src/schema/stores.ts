import { relations } from "drizzle-orm";
import { mysqlTable, serial, text, varchar } from "drizzle-orm/mysql-core";

import { products } from "./products";

export const stores = mysqlTable("Store", {
  id: serial("id").primaryKey(),
  handle: varchar("handle", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  shortenedName: varchar("shortenedName", { length: 255 }).notNull(),
  externalUrl: text("externalUrl").notNull(),
});

export const storesRelations = relations(stores, ({ many }) => {
  return { products: many(products, { relationName: "ProductToStore" }) };
});
