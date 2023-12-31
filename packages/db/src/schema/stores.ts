import { relations } from "drizzle-orm";
import { mysqlTable, text } from "drizzle-orm/mysql-core";

import { products } from "./products";

export const stores = mysqlTable("Store", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull(),
  name: text("name").notNull(),
  shortenedName: text("shortenedName"),
  externalUrl: text("externalUrl").notNull(),
});

export const storesRelations = relations(stores, (helpers) => {
  return { products: helpers.many(products, { relationName: "ProductToStore" }) };
});
