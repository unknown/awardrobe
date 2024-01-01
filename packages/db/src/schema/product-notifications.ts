import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  mysqlTable,
  serial,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { productVariants } from "./product-variants";
import { products } from "./products";
import { users } from "./users";

export const productNotifications = mysqlTable(
  "productNotification",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull(),
    userId: varchar("userId", { length: 255 }).notNull(), // TODO: change to int
    productId: int("productId").notNull(),
    productVariantId: int("productVariantId").notNull(),
    priceInCents: int("priceInCents").notNull(),
    restock: boolean("restock").notNull(),
    priceDrop: boolean("priceDrop").notNull(),
    lastRestockPing: datetime("lastRestockPing", { mode: "date", fsp: 3 }),
    lastPriceDropPing: datetime("lastPriceDropPing", { mode: "date", fsp: 3 }),
  },
  (productNotification) => ({
    publicIdIdx: uniqueIndex("publicIdIdx").on(productNotification.publicId),
    userIdProductVariantIdUnq: unique("userIdProductVariantIdUnq").on(
      productNotification.userId,
      productNotification.productVariantId,
    ),
    userIdIdx: index("userIdIdx").on(productNotification.userId),
    productVariantIdIdx: index("productVariantIdIdx").on(productNotification.productVariantId),
  }),
);

export const productNotificationsRelations = relations(productNotifications, ({ one }) => ({
  user: one(users, {
    relationName: "ProductNotificationToUser",
    fields: [productNotifications.userId],
    references: [users.id],
  }),
  product: one(products, {
    relationName: "ProductNotificationToProduct",
    fields: [productNotifications.productId],
    references: [products.id],
  }),
  productVariant: one(productVariants, {
    relationName: "ProductNotificationToProductVariant",
    fields: [productNotifications.productVariantId],
    references: [productVariants.id],
  }),
}));
