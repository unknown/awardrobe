import { MeiliSearch } from "meilisearch";

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_URL!,
  apiKey: process.env.MEILISEARCH_MASTER_KEY!,
});

export default meilisearch;
