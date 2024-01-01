import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  schema: "./src/schema/",
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
