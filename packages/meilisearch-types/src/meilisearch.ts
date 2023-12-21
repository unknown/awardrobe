import { MeiliSearch } from "meilisearch";

const meilisearchSingleton = () => {
  return new MeiliSearch({
    host: process.env.MEILISEARCH_URL!,
    apiKey: process.env.MEILISEARCH_MASTER_KEY!,
  });
};

export const meilisearch = meilisearchSingleton();
