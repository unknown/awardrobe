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

export type CreateStoreOptions = {
  handle: string;
  name: string;
  shortenedName: string;
  externalUrl: string;
};

export async function createStore(options: CreateStoreOptions): Promise<Store> {
  const { handle, name, shortenedName, externalUrl } = options;

  const storesTable = await db.insert(stores).values({
    handle,
    name,
    shortenedName,
    externalUrl,
  });

  const created = await db.query.stores.findFirst({
    where: eq(stores.id, Number(storesTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create store");
  }

  return created;
}
