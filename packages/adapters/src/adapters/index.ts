import { AbercrombieUS } from "./abercrombie-us";
import { JCrewUS } from "./jcrew-us";
import { StoreAdapter } from "./types";
import { UniqloUS } from "./uniqlo-us";
import { ZaraUS } from "./zara-us";

export { AbercrombieUS, JCrewUS, UniqloUS, ZaraUS };

// TODO: somehow dedupe this?
const adapters: StoreAdapter[] = [AbercrombieUS, JCrewUS, UniqloUS, ZaraUS];

export function getAdapter(storeHandle: string) {
  const adapter = adapters.find((adapter) => adapter.storeHandle === storeHandle);

  if (!adapter) {
    throw new Error(`No adapter implemented for ${storeHandle}`);
  }

  return adapter;
}

export function getAdapterFromUrl(url: string) {
  const productUrl = new URL(url);
  const storeUrl = productUrl.hostname + productUrl.pathname;
  const adapter = adapters.find((adapter) => adapter.urlRegex.test(storeUrl));

  if (!adapter) {
    throw new Error(`No adapter found for ${url}`);
  }

  return adapter;
}
