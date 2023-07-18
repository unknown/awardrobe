import { MeiliSearch } from "meilisearch";

const globalForMeili = globalThis as { meili?: MeiliSearch };

export const meilisearch: MeiliSearch =
  globalForMeili.meili ||
  new MeiliSearch({
    host: process.env.MEILISEARCH_URL!,
    apiKey: process.env.MEILISEARCH_MASTER_KEY!,
  });

if (process.env.NODE_ENV !== "production") globalForMeili.meili = meilisearch;
