import { db } from "./db";
import { Store } from "./schema/types";

export function findStores(): Promise<Store[]> {
  return db.query.stores.findMany();
}
