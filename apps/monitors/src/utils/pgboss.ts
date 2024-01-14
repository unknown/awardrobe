import PgBoss from "pg-boss";

if (!process.env.PG_DATABASE_URL) {
  throw new Error("Missing PG_DATABASE_URL");
}

export const boss = new PgBoss(process.env.PG_DATABASE_URL);
