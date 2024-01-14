import { Job } from "pg-boss";

import { Store } from "@awardrobe/db";
import { logger, logsnag } from "@awardrobe/logger";
import { proxies } from "@awardrobe/proxies";

import {
  insertListing,
  pollStoreListing,
  pollStoreListingsFrequent,
  pollStoreListingsPeriodic,
  updateStores,
} from "./handlers/listings";
import { boss } from "./utils/pgboss";

if (!process.env.PG_DATABASE_URL) {
  throw new Error("Missing PG_DATABASE_URL");
}

function logUnhandledRejection(reason: any): never {
  logger.error(reason);

  logsnag.track({
    channel: "errors",
    event: "Unhandled worker rejection",
    tags: {
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
    },
    notify: true,
  });

  // throw again so that pg-boss retries still happen
  throw reason;
}

async function main() {
  const { numSuccesses, numFailures } = await proxies.testProxies();
  logger.debug(`${numSuccesses} / ${numSuccesses + numFailures} proxies are working`);

  await boss.start();

  const schedules = await boss.getSchedules();
  await Promise.all(schedules.map((schedule) => boss.unschedule(schedule.name)));

  await boss.schedule("poll-store-listings-frequent", "*/10 * * * *");
  await boss.schedule("poll-store-listings-periodic", "0 0 * * *");
  await boss.schedule("update-store-listings", "0 12 * * *");

  boss.on("error", (error) => logger.error(error));

  await boss.work("poll-store-listings-frequent", async () => {
    await pollStoreListingsFrequent().catch(logUnhandledRejection);
  });

  await boss.work("poll-store-listings-periodic", async () => {
    await pollStoreListingsPeriodic().catch(logUnhandledRejection);
  });

  await boss.work(
    "poll-store-listing",
    {
      teamSize: proxies.getNumProxies(),
      teamConcurrency: proxies.getNumProxies(),
      teamRefill: true,
      newJobCheckInterval: 500,
    },
    async (job: Job<{ storeListingId: number }>) => {
      const { storeListingId } = job.data;

      await pollStoreListing(storeListingId).catch(logUnhandledRejection);
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

      await insertListing(externalListingId, store).catch(logUnhandledRejection);
    },
  );

  await boss.work("update-store-listings", async () => {
    await updateStores().catch(logUnhandledRejection);
  });
}

void main();
