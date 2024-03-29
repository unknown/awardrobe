import { relations } from "drizzle-orm";
import { mysqlTable, serial, text, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { collections } from "./collections";

export const brands = mysqlTable(
  "brand",
  {
    id: serial("id").primaryKey(),
    handle: varchar("handle", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    externalUrl: text("externalUrl").notNull(),
  },
  (brand) => ({
    handleUnqIdx: uniqueIndex("handleUnqIdx").on(brand.handle),
  }),
);

export const brandsRelations = relations(brands, ({ many }) => ({
  collections: many(collections, { relationName: "BrandToCollection" }),
}));
