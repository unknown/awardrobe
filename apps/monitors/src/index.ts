import cron from "node-cron";

import { findProductsWithLatestPrice } from "@awardrobe/db";
import { proxies } from "@awardrobe/proxies";

import { updateProducts } from "./monitors";

async function setupMonitors() {
  cron.schedule(`*/10 * * * *`, async () => {
    const start = Date.now();

    const products = await findProductsWithLatestPrice().catch((error) => {
      console.error(`Failed to find products\n${error}`);
      return [];
    });

    console.log(`Updating ${products.length} products`);

    await updateProducts(products).catch((error) => {
      console.error(`Failed to update products\n${error}`);
    });

    const elapsed = (Date.now() - start) / 1000;
    console.log(`Finished updating products in ${elapsed} seconds`);
  });
}

async function main() {
  const { numSuccesses, numFailures } = await proxies.testProxies();
  console.log(`${numSuccesses} / ${numSuccesses + numFailures} proxies are working`);

  await setupMonitors().catch((error) => {
    console.error(`Error setting up monitors\n${error}`);
  });
}

void main();
