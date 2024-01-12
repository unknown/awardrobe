import { and, count, eq, inArray, notInArray } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariantListings } from "./schema/product-variant-listings";
import { storeListings } from "./schema/store-listings";
import { StoreListing, StoreListingWithStore } from "./schema/types";

export type CreateStoreListingOptions = {
  externalListingId: string;
  storeId: number;
};

export async function createStoreListing(
  options: CreateStoreListingOptions,
): Promise<StoreListing> {
  const { externalListingId, storeId } = options;

  const listingsTable = await db.insert(storeListings).values({ externalListingId, storeId });

  const created = await db.query.storeListings.findFirst({
    where: eq(storeListings.id, Number(listingsTable.insertId)),
  });

  if (!created) {
    throw new Error(`Failed to create store listing for ${externalListingId}`);
  }

  return created;
}

export type FindStoreListingsOptions = {
  externalListingIds: string[];
  storeId: number;
};

export async function findStoreListings(
  options: FindStoreListingsOptions,
): Promise<StoreListing[]> {
  const { externalListingIds, storeId } = options;

  if (externalListingIds.length === 0) {
    return [];
  }

  return db.query.storeListings.findMany({
    where: and(
      inArray(storeListings.externalListingId, externalListingIds),
      eq(storeListings.storeId, storeId),
    ),
  });
}

export async function findFrequentStoreListings(): Promise<StoreListingWithStore[]> {
  return db.query.storeListings.findMany({
    where: (storeListing) =>
      and(
        inArray(
          storeListing.id,
          db
            .selectDistinct({ storeListingId: productVariantListings.storeListingId })
            .from(productVariantListings)
            .where(
              inArray(
                productVariantListings.productVariantId,
                db
                  .selectDistinct({ variantId: productNotifications.productVariantId })
                  .from(productNotifications),
              ),
            ),
        ),
        eq(storeListing.active, true),
      ),
    with: { store: true },
  });
}

// TODO: double check this query
export async function findPeriodicStoreListings(): Promise<StoreListingWithStore[]> {
  return db.query.storeListings.findMany({
    where: (storeListing) =>
      and(
        notInArray(
          storeListing.id,
          db
            .selectDistinct({ storeListingId: productVariantListings.storeListingId })
            .from(productVariantListings)
            .where(
              inArray(
                productVariantListings.productVariantId,
                db
                  .selectDistinct({ variantId: productNotifications.productVariantId })
                  .from(productNotifications),
              ),
            ),
        ),
        eq(storeListing.active, true),
      ),
    with: { store: true },
  });
}

export type UpdateStoreListingsOptions = {
  listingIds: number[];
  active: boolean;
};

export async function updateStoreListings(options: UpdateStoreListingsOptions): Promise<void> {
  const { listingIds, active } = options;

  if (listingIds.length === 0) {
    return;
  }

  await db.update(storeListings).set({ active }).where(inArray(storeListings.id, listingIds));
}
