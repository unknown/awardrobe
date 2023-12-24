import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "cjs",
  tsconfig: "tsconfig.json",
  skipNodeModulesBundle: true,
  noExternal: [/@awardrobe\/.+/],
});
