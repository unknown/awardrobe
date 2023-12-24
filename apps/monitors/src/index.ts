import PgBoss, { Job } from "pg-boss";

import { getAdapter } from "@awardrobe/adapters";
import { findProducts, findProductWithLatestPrice, findStores } from "@awardrobe/db";
import { prisma } from "@awardrobe/prisma-types";
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
  await boss.schedule("update-products-list", "0 0 * * *");

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

      const product = await findProductWithLatestPrice(productId).catch((error) => {
        console.error(`Failed to find product ${productId}\n${error}`);
        return null;
      });

      if (!product) {
        return;
      }

      await updateProduct(product).catch((error) => {
        console.error(`Failed to update product\n${error}`);
      });
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

      await insertProduct(productCode, storeHandle).catch((error) => {
        console.error(`Failed to insert product\n${error}`);
      });
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
      const products = await adapter.getProducts(limit).catch((error) => {
        console.error(`Failed to get products for ${store.handle}\n${error}`);
        return [];
      });

      console.log(`Found ${products.length} products for ${store.handle}`);

      for (const productCode of products) {
        const product = await prisma.product.findFirst({
          where: {
            productCode,
            store: { handle: store.handle },
          },
        });

        if (product) {
          continue;
        }

        await boss.send("insert-product", { productCode, storeHandle: store.handle });
      }
    }
  });
}

void main();
