import { relations } from "drizzle-orm";
import {
  index,
  int,
  mysqlTable,
  serial,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { brands } from "./brands";
import { products } from "./products";

export const collections = mysqlTable(
  "collection",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull(),
    brandId: int("brandId").notNull(),
    externalCollectionId: varchar("externalCollectionId", { length: 255 }).notNull(),
  },
  (collection) => ({
    publicIdIdx: uniqueIndex("publicIdIdx").on(collection.publicId),
    brandIdIdx: index("brandIdIdx").on(collection.brandId),
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
