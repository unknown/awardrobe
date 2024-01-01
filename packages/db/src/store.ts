import { eq } from "drizzle-orm";

import { db } from "./db";
import { stores } from "./schema/stores";
import { Store } from "./schema/types";

export function findStores(): Promise<Store[]> {
  return db.query.stores.findMany();
}

export type FindStoreOptions = {
  storeHandle: string;
};

export function findStore(options: FindStoreOptions): Promise<Store | undefined> {
  const { storeHandle } = options;

  return db.query.stores.findFirst({
    where: eq(stores.handle, storeHandle),
  });
}
