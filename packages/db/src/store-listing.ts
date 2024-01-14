import { and, eq, inArray, notInArray } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariantListings } from "./schema/product-variant-listings";
import { storeListings } from "./schema/store-listings";
import { StoreListing } from "./schema/types";

export type FindOrCreateStoreListingOptions = {
  externalListingId: string;
  storeId: number;
};

export async function findOrCreateStoreListing(
  options: FindOrCreateStoreListingOptions,
): Promise<StoreListing> {
  const { externalListingId, storeId } = options;

  const existing = await db.query.storeListings.findFirst({
    where: and(
      eq(storeListings.externalListingId, externalListingId),
      eq(storeListings.storeId, storeId),
    ),
  });

  if (existing) {
    return existing;
  }

  const listingsTable = await db.insert(storeListings).values({ externalListingId, storeId });

  const created = await db.query.storeListings.findFirst({
    where: eq(storeListings.id, Number(listingsTable.insertId)),
  });

  if (!created) {
    throw new Error(`Failed to create store listing for ${externalListingId}`);
  }

  return created;
}

export type FindStoreListingsFromExternalIdsOptions = {
  externalListingIds: string[];
  storeId: number;
};

export async function findStoreListingsFromExternalIds(
  options: FindStoreListingsFromExternalIdsOptions,
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

export async function findFrequentStoreListings(): Promise<StoreListing[]> {
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
  });
}

// TODO: double check this query
export async function findPeriodicStoreListings(): Promise<StoreListing[]> {
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
  });
}

export type StoreListingPollData = NonNullable<
  Awaited<
    ReturnType<
      typeof db.query.storeListings.findFirst<{
        with: {
          store: true;
          productVariantListings: { with: { latestPrice: true; productVariant: true } };
        };
      }>
    >
  >
>;

export type FindStoreListingPollDataOptions = {
  storeListingId: number;
};

export async function findStoreListingPollData(
  options: FindStoreListingPollDataOptions,
): Promise<StoreListingPollData | null> {
  const { storeListingId } = options;

  const storeListing = await db.query.storeListings.findFirst({
    where: eq(storeListings.id, storeListingId),
    with: {
      store: true,
      productVariantListings: { with: { latestPrice: true, productVariant: true } },
    },
  });

  return storeListing ?? null;
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
