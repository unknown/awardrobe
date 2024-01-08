import { AbercrombieUS } from "./abercrombie-us";
import { JCrewUS } from "./jcrew-us";
import { LevisUS } from "./levis-us";
import { StoreAdapter } from "./types";
import { UniqloUS } from "./uniqlo-us";
import { ZaraUS } from "./zara-us";

export { AbercrombieUS, JCrewUS, LevisUS, UniqloUS, ZaraUS };

// TODO: somehow dedupe this?
const adapters: StoreAdapter[] = [AbercrombieUS, JCrewUS, LevisUS, UniqloUS, ZaraUS];

export function getAdapter(storeHandle: string) {
  return adapters.find((adapter) => adapter.storeHandle === storeHandle) ?? null;
}

export function getAdapterFromUrl(url: string) {
  const productUrl = new URL(url);
  const storeUrl = productUrl.hostname + productUrl.pathname;
  return adapters.find((adapter) => adapter.urlRegex.test(storeUrl)) ?? null;
}
