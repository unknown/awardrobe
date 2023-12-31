import { relations } from "drizzle-orm";
import { json, mysqlTable, text } from "drizzle-orm/mysql-core";

import { prices } from "./prices";
import { productNotifications } from "./product-notifications";
import { products } from "./products";

export const productVariants = mysqlTable("ProductVariant", {
  id: text("id").primaryKey(),
  productId: text("productId").notNull(),
  productUrl: text("productUrl").notNull(),
  attributes: json("attributes").notNull(),
  latestPriceId: text("latestPriceId"),
});

export const productVariantsRelations = relations(productVariants, (helpers) => {
  return {
    prices: helpers.many(prices, { relationName: "PriceToProductVariant" }),
    notifications: helpers.many(productNotifications, {
      relationName: "ProductNotificationToProductVariant",
    }),
    product: helpers.one(products, {
      relationName: "ProductToProductVariant",
      fields: [productVariants.productId],
      references: [products.id],
    }),
    latestPrice: helpers.one(prices, {
      relationName: "LatestPrice",
      fields: [productVariants.latestPriceId],
      references: [prices.id],
    }),
  };
});
