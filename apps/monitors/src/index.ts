import PgBoss, { Job } from "pg-boss";

import { getAdapter } from "@awardrobe/adapters";
import {
  findFrequentStoreListings,
  findPeriodicStoreListings,
  findStoreListingsFromExternalIds,
  findStores,
  Store,
  StoreListingWithStore,
  updateStoreListings,
} from "@awardrobe/db";
import { proxies } from "@awardrobe/proxies";

import { insertStoreListing, pollStoreListing } from "./monitors";

async function main() {
  const { numSuccesses, numFailures } = await proxies.testProxies();
  console.log(`${numSuccesses} / ${numSuccesses + numFailures} proxies are working`);

  if (!process.env.PG_DATABASE_URL) {
    throw new Error("Missing PG_DATABASE_URL");
  }

  const boss = new PgBoss(process.env.PG_DATABASE_URL);
  await boss.start();

  const schedules = await boss.getSchedules();
  await Promise.all(schedules.map((schedule) => boss.unschedule(schedule.name)));

  await boss.schedule("poll-store-listings-frequent", "*/10 * * * *");
  await boss.schedule("poll-store-listings-periodic", "0 0 * * *");
  await boss.schedule("update-store-listings", "0 12 * * *");

  boss.on("error", (error) => console.error(error));

  await boss.work("poll-store-listings-frequent", async () => {
    const listings = await findFrequentStoreListings();
    console.log(`[Frequent] Updating ${listings.length} store listings`);

    await boss.insert(
      listings.map((listing) => ({
        name: "poll-store-listing",
        data: { listing },
        singletonKey: listing.id.toString(),
        priority: 10,
        expireInSeconds: 3 * 60 * 60,
      })),
    );
  });

  await boss.work("poll-store-listings-periodic", async () => {
    const listings = await findPeriodicStoreListings();
    console.log(`[Periodic] Updating ${listings.length} store listings`);

    await boss.insert(
      listings.map((listing) => ({
        name: "poll-store-listing",
        data: { listing },
        singletonKey: listing.id.toString(),
        expireInSeconds: 3 * 60 * 60,
      })),
    );
  });

  await boss.work(
    "poll-store-listing",
    {
      teamSize: proxies.getNumProxies(),
      teamConcurrency: proxies.getNumProxies(),
      teamRefill: true,
      newJobCheckInterval: 500,
    },
    async (job: Job<{ listing: StoreListingWithStore }>) => {
      const { listing } = job.data;

      await pollStoreListing(listing);
    },
  );

  await boss.work(
    "insert-store-listing",
    {
      teamSize: proxies.getNumProxies(),
      teamConcurrency: proxies.getNumProxies(),
      teamRefill: true,
      newJobCheckInterval: 2000,
    },
    async (job: Job<{ externalListingId: string; store: Store }>) => {
      const { externalListingId, store } = job.data;

      await insertStoreListing(externalListingId, store);
      console.log(`Inserted ${externalListingId} for ${store.name}`);
    },
  );

  await boss.work("update-store-listings", async () => {
    const stores = await findStores();
    console.log(`Updating listings for ${stores.length} stores`);

    for (const store of stores) {
      const adapter = getAdapter(store.handle);

      if (!adapter) {
        console.error(`No adapter found for ${store.handle}`);
        continue;
      }

      const limit = process.env.NODE_ENV === "production" ? undefined : 10;
      const listingIds = await adapter.getListingIds(limit);
      if (listingIds.size === 0) {
        console.warn(`No products found for ${store.handle}`);
        continue;
      }

      const existingListings = await findStoreListingsFromExternalIds({
        storeId: store.id,
        externalListingIds: Array.from(listingIds),
      });

      const newExternalListingIds = new Set(listingIds);
      const reactivatedListingIds: number[] = [];
      existingListings.forEach((listing) => {
        if (!listing.active) {
          reactivatedListingIds.push(listing.id);
        }
        newExternalListingIds.delete(listing.externalListingId);
      });

      console.log(
        `Inserting ${newExternalListingIds.size} listings and reactivating ${reactivatedListingIds.length} listings for ${store.handle}`,
      );

      await updateStoreListings({
        listingIds: reactivatedListingIds,
        active: true,
      });

      await boss.insert(
        Array.from(newExternalListingIds).map((externalListingId) => ({
          name: "insert-store-listing",
          data: { externalListingId, store },
          singletonKey: `${store.handle}:${externalListingId}`,
          expireInSeconds: 3 * 60 * 60,
        })),
      );
    }
  });
}

void main();
