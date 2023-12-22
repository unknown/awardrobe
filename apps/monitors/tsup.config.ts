import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  tsconfig: "tsconfig.json",
  noExternal: [
    "@awardrobe/adapters",
    "@awardrobe/db",
    "@awardrobe/emails",
    "@awardrobe/prisma-types",
    "@awardrobe/proxies",
    "@awardrobe/tsconfig",
  ],
});
