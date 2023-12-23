import PgBoss, { Job } from "pg-boss";

import { findProducts, findProductWithLatestPrice } from "@awardrobe/db";
import { proxies } from "@awardrobe/proxies";

import { updateProduct } from "./monitors";

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
  await boss.schedule("update-products-daily", "0 0 * * *");

  await boss.work("update-products-frequent", async () => {
    const products = await findProducts({ numNotified: { gte: 1 } });
    console.log(`[Frequent] Updating ${products.length} products`);

    await boss.insert(
      products.map((product) => ({
        name: "update-product",
        data: { productId: product.id },
        singletonKey: product.id,
      })),
    );
  });

  await boss.work("update-products-daily", async () => {
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
      newJobCheckInterval: 250,
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
}

void main();
