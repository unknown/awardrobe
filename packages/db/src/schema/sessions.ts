import { relations } from "drizzle-orm";
import { datetime, index, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { users } from "./users";

export const sessions = mysqlTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: datetime("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIx: index("userIdIx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    relationName: "SessionToUser",
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
