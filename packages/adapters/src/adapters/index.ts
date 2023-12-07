import { AbercrombieUS } from "./abercrombie-us";
import { JCrewUS } from "./jcrew-us";
import { StoreAdapter } from "./types";
import { UniqloUS } from "./uniqlo-us";
import { ZaraUS } from "./zara-us";

export { AbercrombieUS, JCrewUS, UniqloUS, ZaraUS };

// TODO: somehow dedupe this?
const adapters: StoreAdapter[] = [AbercrombieUS, JCrewUS, UniqloUS, ZaraUS];

export function getAdapter(storeHandle: string) {
  return adapters.find((adapter) => adapter.storeHandle === storeHandle) ?? null;
}

export function getAdapterFromUrl(url: string) {
  const productUrl = new URL(url);
  const storeUrl = productUrl.hostname + productUrl.pathname;
  return adapters.find((adapter) => adapter.urlRegex.test(storeUrl)) ?? null;
}
