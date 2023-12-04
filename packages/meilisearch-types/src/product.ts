import { z } from "zod";

import { meilisearch } from "./meilisearch";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  storeName: z.string(),
});

export type Product = z.infer<typeof productSchema>;

export async function searchProducts(options: {
  query: string;
  page?: number;
  hitsPerPage?: number;
}) {
  const { query, page, hitsPerPage = 24 } = options;

  return await meilisearch.index("products").search(query, { page, hitsPerPage });
}

export async function addProduct(productDocument: Product) {
  return await meilisearch.index("products").addDocuments([productDocument], { primaryKey: "id" });
}
