import { relations } from "drizzle-orm";
import { boolean, datetime, int, mysqlTable, text } from "drizzle-orm/mysql-core";

import { productVariants } from "./product-variants";
import { users } from "./users";

export const productNotifications = mysqlTable("ProductNotification", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  productVariantId: text("productVariantId").notNull(),
  priceInCents: int("priceInCents"),
  restock: boolean("restock").notNull(),
  priceDrop: boolean("priceDrop").notNull(),
  lastRestockPing: datetime("lastRestockPing", { mode: "date", fsp: 3 }),
  lastPriceDropPing: datetime("lastPriceDropPing", { mode: "date", fsp: 3 }),
});

export const productNotificationsRelations = relations(productNotifications, (helpers) => {
  return {
    user: helpers.one(users, {
      relationName: "ProductNotificationToUser",
      fields: [productNotifications.userId],
      references: [users.id],
    }),
    productVariant: helpers.one(productVariants, {
      relationName: "ProductNotificationToProductVariant",
      fields: [productNotifications.productVariantId],
      references: [productVariants.id],
    }),
  };
});
