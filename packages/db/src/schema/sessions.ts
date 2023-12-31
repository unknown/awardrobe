import { relations } from "drizzle-orm";
import { datetime, mysqlTable, text } from "drizzle-orm/mysql-core";

import { users } from "./users";

export const sessions = mysqlTable("Session", {
  id: text("id").primaryKey(),
  sessionToken: text("sessionToken").notNull(),
  userId: text("userId").notNull(),
  expires: datetime("expires", { mode: "date", fsp: 3 }).notNull(),
});

export const sessionsRelations = relations(sessions, (helpers) => {
  return {
    user: helpers.one(users, {
      relationName: "SessionToUser",
      fields: [sessions.userId],
      references: [users.id],
    }),
  };
});
