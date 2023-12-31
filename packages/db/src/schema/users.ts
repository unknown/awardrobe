import { relations, sql } from "drizzle-orm";
import { datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { accounts } from "./accounts";
import { productNotifications } from "./product-notifications";
import { sessions } from "./sessions";

export const users = mysqlTable("User", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: datetime("emailVerified", { mode: "date", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP(3)`,
  ),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts, { relationName: "AccountToUser" }),
  sessions: many(sessions, { relationName: "SessionToUser" }),
  productNotifications: many(productNotifications, {
    relationName: "ProductNotificationToUser",
  }),
}));
