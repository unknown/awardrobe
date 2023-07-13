import { AbercrombieUS, UniqloUS } from "@awardrobe/adapters";

const uniqloUSAdapter = UniqloUS;
const abercrombieUSAdapter = AbercrombieUS;

export function getAdapter(storeHandle: string) {
  switch (storeHandle) {
    case "uniqlo-us":
      return uniqloUSAdapter;
    case "abercrombie-us":
      return abercrombieUSAdapter;
    default:
      throw new Error(`No adapter implemented for ${storeHandle}`);
  }
}
