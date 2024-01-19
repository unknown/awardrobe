import { relations } from "drizzle-orm";
import {
  index,
  int,
  mysqlTable,
  serial,
  text,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { collections } from "./collections";
import { productNotifications } from "./product-notifications";
import { productVariants } from "./product-variants";

export const products = mysqlTable(
  "product",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull(),
    collectionId: int("collectionId").notNull(),
    externalProductId: varchar("externalProductId", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
  },
  (product) => ({
    publicIdIdx: uniqueIndex("publicIdIdx").on(product.publicId),
    collectionIdProductIdUnq: unique("collectionIdProductIdUnq").on(
      product.collectionId,
      product.externalProductId,
    ),
    collectionIdIdx: index("collectionIdIdx").on(product.collectionId),
  }),
);

export const productsRelations = relations(products, ({ many, one }) => ({
  variants: many(productVariants, { relationName: "ProductToProductVariant" }),
  notifications: many(productNotifications, {
    relationName: "ProductNotificationToProduct",
  }),
  collection: one(collections, {
    relationName: "CollectionToProduct",
    fields: [products.collectionId],
    references: [collections.id],
  }),
}));
