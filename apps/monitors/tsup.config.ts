import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "cjs",
  tsconfig: "tsconfig.json",
  skipNodeModulesBundle: true,
  noExternal: [
    "@awardrobe/adapters",
    "@awardrobe/db",
    "@awardrobe/emails",
    "@awardrobe/prisma-types",
    "@awardrobe/proxies",
    "@awardrobe/tsconfig",
  ],
});
