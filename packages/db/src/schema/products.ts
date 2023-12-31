import { relations } from "drizzle-orm";
import { int, mysqlTable, text } from "drizzle-orm/mysql-core";

import { productVariants } from "./product-variants";
import { stores } from "./stores";

export const products = mysqlTable("Product", {
  id: text("id").primaryKey(),
  storeId: text("storeId").notNull(),
  productCode: text("productCode").notNull(),
  name: text("name").notNull(),
  numNotified: int("numNotified").notNull(),
});

export const productsRelations = relations(products, (helpers) => {
  return {
    variants: helpers.many(productVariants, { relationName: "ProductToProductVariant" }),
    store: helpers.one(stores, {
      relationName: "ProductToStore",
      fields: [products.storeId],
      references: [stores.id],
    }),
  };
});
