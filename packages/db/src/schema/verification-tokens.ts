import { datetime, mysqlTable, text } from "drizzle-orm/mysql-core";

export const verificationTokens = mysqlTable("VerificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: datetime("expires", { mode: "date", fsp: 3 }).notNull(),
});
