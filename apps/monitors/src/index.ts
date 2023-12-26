import PgBoss, { Job } from "pg-boss";

import { getAdapter } from "@awardrobe/adapters";
import { findProducts, findProductsByProductCodes, findStores } from "@awardrobe/db";
import { proxies } from "@awardrobe/proxies";

import { insertProduct, updateProduct } from "./monitors";

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

  await boss.schedule("update-products-frequent", "*/10 * * * *");
  await boss.schedule("update-products-periodic", "0 0 * * *");
  await boss.schedule("update-products-list", "0 12 * * *");

  await boss.work("update-products-frequent", async () => {
    const products = await findProducts({ numNotified: { gte: 1 } });
    console.log(`[Frequent] Updating ${products.length} products`);

    await boss.insert(
      products.map((product) => ({
        name: "update-product",
        data: { productId: product.id },
        singletonKey: product.id,
        priority: 10,
      })),
    );
  });

  await boss.work("update-products-periodic", async () => {
    const products = await findProducts({ numNotified: { lte: 0 } });
    console.log(`[Daily] Updating ${products.length} products`);

    await boss.insert(
      products.map((product) => ({
        name: "update-product",
        data: { productId: product.id },
        singletonKey: product.id,
      })),
    );
  });

  await boss.work(
    "update-product",
    {
      teamSize: proxies.getNumProxies(),
      teamConcurrency: proxies.getNumProxies(),
      teamRefill: true,
      newJobCheckInterval: 500,
    },
    async (job: Job<{ productId: string }>) => {
      const { productId } = job.data;

      await updateProduct(productId);
    },
  );

  await boss.work(
    "insert-product",
    {
      teamSize: proxies.getNumProxies(),
      teamConcurrency: proxies.getNumProxies(),
      teamRefill: true,
      newJobCheckInterval: 2000,
    },
    async (job: Job<{ productCode: string; storeHandle: string }>) => {
      const { productCode, storeHandle } = job.data;

      const product = await insertProduct(productCode, storeHandle);
      console.log(`Inserted ${product.name} for ${storeHandle}`);
    },
  );

  await boss.work("update-products-list", async () => {
    const stores = await findStores();
    console.log(`Updating ${stores.length} stores`);

    for (const store of stores) {
      const adapter = getAdapter(store.handle);

      if (!adapter) {
        console.error(`No adapter found for ${store.handle}`);
        continue;
      }

      const limit = process.env.NODE_ENV === "production" ? undefined : 10;
      const productCodes = await adapter.getProducts(limit);
      const products = await findProductsByProductCodes({
        productCodes,
        storeHandle: store.handle,
      });
      const existingProductCodes = new Set(products.map((product) => product.productCode));

      console.log(
        `Inserting ${existingProductCodes.size - productCodes.length} products for ${store.handle}`,
      );

      await boss.insert(
        productCodes
          .filter((productCode) => !existingProductCodes.has(productCode))
          .map((productCode) => ({
            name: "insert-product",
            data: { productCode, storeHandle: store.handle },
            singletonKey: `${store.handle}:${productCode}`,
            expireInSeconds: 3 * 60 * 60,
          })),
      );
    }
  });
}

void main();
