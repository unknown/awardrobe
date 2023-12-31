import { datetime, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";

export const verificationTokens = mysqlTable(
  "VerificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: datetime("expires", { mode: "date", fsp: 3 }).notNull(),
  },
  (verificationToken) => ({
    compoundKey: primaryKey({ columns: [verificationToken.identifier, verificationToken.token] }),
  }),
);
