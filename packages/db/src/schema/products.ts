import { relations } from "drizzle-orm";
import { index, int, mysqlTable, serial, unique, varchar } from "drizzle-orm/mysql-core";

import { productNotifications } from "./product-notifications";
import { productVariants } from "./product-variants";
import { stores } from "./stores";

export const products = mysqlTable(
  "product",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull(),
    storeId: int("storeId").notNull(),
    productCode: varchar("productCode", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (product) => ({
    publicIdIdx: index("publicIdIdx").on(product.publicId),
    storeIdProductCodeUnq: unique("storeIdProductCodeUnq").on(product.storeId, product.productCode),
    storeIdIx: index("storeIdIx").on(product.storeId),
  }),
);

export const productsRelations = relations(products, ({ many, one }) => ({
  variants: many(productVariants, { relationName: "ProductToProductVariant" }),
  notifications: many(productNotifications, {
    relationName: "ProductNotificationToProduct",
  }),
  store: one(stores, {
    relationName: "ProductToStore",
    fields: [products.storeId],
    references: [stores.id],
  }),
}));
