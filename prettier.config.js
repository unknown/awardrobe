/** @typedef  {import("prettier").Config} PrettierConfig*/
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig*/
/** @typedef  {import("prettier-plugin-tailwindcss").PluginOptions} TailwindPluginConfig*/

/** @type { PrettierConfig | SortImportsConfig | TailwindPluginConfig } */
const config = {
  printWidth: 100,
  singleQuote: false,
  tabWidth: 2,
  semi: true,
  trailingComma: "all",
  plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@awardrobe/(.*)$",
    "",
    "^@/(.*)$",
    "^[./]",
  ],
  tailwindFunctions: ["cva"],
};

module.exports = config;
