import { relations } from "drizzle-orm";
import { boolean, datetime, int, mysqlTable, text } from "drizzle-orm/mysql-core";

import { productVariants } from "./product-variants";

export const prices = mysqlTable("Price", {
  id: text("id").primaryKey(),
  productVariantId: text("productVariantId").notNull(),
  timestamp: datetime("timestamp", { mode: "date", fsp: 3 }).notNull(),
  priceInCents: int("priceInCents").notNull(),
  inStock: boolean("inStock").notNull(),
});

export const pricesRelations = relations(prices, (helpers) => {
  return {
    productVariant: helpers.one(productVariants, {
      relationName: "PriceToProductVariant",
      fields: [prices.productVariantId],
      references: [productVariants.id],
    }),
    latestInProductVariant: helpers.one(productVariants, {
      relationName: "LatestPrice",
      fields: [prices.id],
      references: [productVariants.latestPriceId],
    }),
  };
});
