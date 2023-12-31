import { relations } from "drizzle-orm";
import { index, int, mysqlTable, serial, unique, varchar } from "drizzle-orm/mysql-core";

import { productVariants } from "./product-variants";
import { stores } from "./stores";

export const products = mysqlTable(
  "Product",
  {
    id: serial("id").primaryKey(),
    storeId: int("storeId").notNull(),
    productCode: varchar("productCode", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    numNotified: int("numNotified").notNull(),
  },
  (product) => ({
    storeIdProductCodeUnq: unique("storeIdProductCodeUnq").on(product.storeId, product.productCode),
    storeIdIx: index("storeIdIx").on(product.storeId),
  }),
);

export const productsRelations = relations(products, ({ many, one }) => ({
  variants: many(productVariants, { relationName: "ProductToProductVariant" }),
  store: one(stores, {
    relationName: "ProductToStore",
    fields: [products.storeId],
    references: [stores.id],
  }),
}));
