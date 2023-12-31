import { relations } from "drizzle-orm";
import { datetime, mysqlTable, text } from "drizzle-orm/mysql-core";

import { accounts } from "./accounts";
import { productNotifications } from "./product-notifications";
import { sessions } from "./sessions";

export const users = mysqlTable("User", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: datetime("emailVerified", { mode: "date", fsp: 3 }),
  image: text("image"),
});

export const usersRelations = relations(users, (helpers) => {
  return {
    accounts: helpers.many(accounts, { relationName: "AccountToUser" }),
    sessions: helpers.many(sessions, { relationName: "SessionToUser" }),
    productNotifications: helpers.many(productNotifications, {
      relationName: "ProductNotificationToUser",
    }),
  };
});
