import AbercrombieUS from "./abercrombie-us";
import UniqloUS from "./uniqlo-us";

export { AbercrombieUS, UniqloUS };

// TODO: somehow dedupe this?
const adapters = [AbercrombieUS, UniqloUS];

export function getAdapter(storeHandle: string) {
  const adapter = adapters.find((adapter) => adapter.storeHandle === storeHandle);
  if (!adapter) {
    throw new Error(`No adapter implemented for ${storeHandle}`);
  }
  return adapter;
}

export function getAdapterFromUrl(url: string) {
  const storeUrlRegex = /https?:\/\/(?:www\.)?(.+)/;
  const matches = url.match(storeUrlRegex);

  const storeUrl = matches?.[1];
  if (!storeUrl) {
    throw new Error(`Failed to get store url from ${url}`);
  }

  const adapter = adapters.find((adapter) =>
    adapter.urlPrefixes.some((prefix) => storeUrl.startsWith(prefix)),
  );
  if (!adapter) {
    throw new Error(`No adapter found for ${url}`);
  }

  return adapter;
}
