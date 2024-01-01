import { relations } from "drizzle-orm";
import { boolean, datetime, index, int, mysqlTable, serial } from "drizzle-orm/mysql-core";

import { productVariants } from "./product-variants";

export const prices = mysqlTable(
  "price",
  {
    id: serial("id").primaryKey(),
    productVariantId: int("productVariantId").notNull(),
    timestamp: datetime("timestamp", { mode: "date", fsp: 3 }).notNull(),
    priceInCents: int("priceInCents").notNull(),
    inStock: boolean("inStock").notNull(),
  },
  (price) => ({
    productVariantIdIx: index("productVariantIdIx").on(price.productVariantId),
  }),
);

export const pricesRelations = relations(prices, ({ one }) => ({
  productVariant: one(productVariants, {
    relationName: "PriceToProductVariant",
    fields: [prices.productVariantId],
    references: [productVariants.id],
  }),
  latestInProductVariant: one(productVariants, {
    relationName: "LatestPrice",
    fields: [prices.id],
    references: [productVariants.latestPriceId],
  }),
}));