import { Job, Queue, Worker } from "bullmq";
import IORedis from "ioredis";

import { findProducts, findProductWithLatestPrice } from "@awardrobe/db";
import { proxies } from "@awardrobe/proxies";

import { updateProduct } from "./monitors";

// TODO: improve this
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Missing REDIS_URL");
}
const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const queue = new Queue("monitors", { connection: redis });

async function handleJob(job: Job) {
  switch (job.name) {
    case "refresh":
      const products = await findProducts().catch((error) => {
        console.error(`Failed to find products\n${error}`);
        return [];
      });

      console.log(`Updating ${products.length} products`);

      queue.addBulk(
        products.map((product) => ({
          name: "updateProduct",
          data: { productId: product.id },
        })),
      );

      break;

    case "updateProduct":
      const { productId }: { productId: string } = job.data;
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

      break;
  }
}

async function main() {
  const { numSuccesses, numFailures } = await proxies.testProxies();
  console.log(`${numSuccesses} / ${numSuccesses + numFailures} proxies are working`);

  await queue.obliterate();
  await queue.add("refresh", { type: "frequent" }, { repeat: { pattern: "*/10 * * * *" } });

  new Worker("monitors", handleJob, {
    connection: redis,
    limiter: { max: proxies.getNumProxies(), duration: 250 },
  });
}

void main();
