import { relations } from "drizzle-orm";
import {
  customType,
  index,
  int,
  mysqlTable,
  serial,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { VariantAttribute } from "@awardrobe/adapters";

import { productNotifications } from "./product-notifications";
import { productVariantListings } from "./product-variant-listings";
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
    attributes: attributesType("attributes").notNull(),
  },
  (productVariant) => ({
    publicIdIdx: uniqueIndex("publicIdIdx").on(productVariant.publicId),
    productIdIx: index("productIdIx").on(productVariant.productId),
  }),
);

export const productVariantsRelations = relations(productVariants, ({ many, one }) => ({
  notifications: many(productNotifications, {
    relationName: "ProductNotificationToProductVariant",
  }),
  product: one(products, {
    relationName: "ProductToProductVariant",
    fields: [productVariants.productId],
    references: [products.id],
  }),
  listings: many(productVariantListings, { relationName: "ProductVariantToListings" }),
}));
