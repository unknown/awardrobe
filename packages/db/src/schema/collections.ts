import { relations } from "drizzle-orm";
import { int, mysqlTable, serial, unique, varchar } from "drizzle-orm/mysql-core";

import { brands } from "./brands";
import { products } from "./products";

export const collections = mysqlTable(
  "collection",
  {
    id: serial("id").primaryKey(),
    brandId: int("brandId").notNull(),
    externalCollectionId: varchar("externalCollectionId", { length: 255 }).notNull(),
  },
  (collection) => ({
    brandIdCollectionIdUnq: unique("brandIdCollectionIdUnq").on(
      collection.brandId,
      collection.externalCollectionId,
    ),
  }),
);

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  brand: one(brands, {
    relationName: "BrandToCollection",
    fields: [collections.brandId],
    references: [brands.id],
  }),
  products: many(products, { relationName: "CollectionToProduct" }),
}));
