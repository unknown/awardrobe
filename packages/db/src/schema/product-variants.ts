import { relations } from "drizzle-orm";
import { customType, index, int, mysqlTable, serial, text, varchar } from "drizzle-orm/mysql-core";

import { VariantAttribute } from "@awardrobe/adapters";

import { prices } from "./prices";
import { productNotifications } from "./product-notifications";
import { products } from "./products";

const attributesType = customType<{ data: VariantAttribute[]; driverData: string }>({
  dataType() {
    return "json";
  },
  toDriver(value: VariantAttribute[]): string {
    return JSON.stringify(value);
  },
});

export const productVariants = mysqlTable(
  "productVariant",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull(),
    productId: int("productId").notNull(),
    productUrl: text("productUrl").notNull(),
    attributes: attributesType("attributes").notNull(),
    latestPriceId: int("latestPriceId"),
  },
  (productVariant) => ({
    publicIdIdx: index("publicIdIdx").on(productVariant.publicId),
    productIdIx: index("productIdIx").on(productVariant.productId),
  }),
);

export const productVariantsRelations = relations(productVariants, ({ many, one }) => ({
  prices: many(prices, { relationName: "PriceToProductVariant" }),
  notifications: many(productNotifications, {
    relationName: "ProductNotificationToProductVariant",
  }),
  product: one(products, {
    relationName: "ProductToProductVariant",
    fields: [productVariants.productId],
    references: [products.id],
  }),
  latestPrice: one(prices, {
    relationName: "LatestPrice",
    fields: [productVariants.latestPriceId],
    references: [prices.id],
  }),
}));
