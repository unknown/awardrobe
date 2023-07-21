import "dotenv/config";

import cron from "node-cron";

import { testProxy } from "@awardrobe/adapters";
import { prisma } from "@awardrobe/prisma-types";

import { updateProducts } from "./monitors";
import { ExtendedProduct, PartialPrice } from "./monitors/types";

async function getExtendedProducts(offset?: number) {
  const products: ExtendedProduct[] = await prisma.product.findMany({
    include: { variants: true, store: true },
    skip: offset,
  });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: products.flatMap((product) => product.variants.map((variant) => variant.id)) },
    },
    include: {
      prices: { take: 1, orderBy: { timestamp: "desc" }, where: { timestamp: { gte: yesterday } } },
    },
  });

  // TODO: store most recent prices in a redis store?
  const priceFromVariant = new Map<string, PartialPrice>();
  variants.forEach((variant) => {
    const price = variant.prices[0];
    if (!price) return;
    const { priceInCents, inStock, timestamp } = price;
    priceFromVariant.set(variant.id, { priceInCents, inStock, timestamp });
  });

  return { products, priceFromVariant };
}

async function setupMonitors() {
  const { products, priceFromVariant } = await getExtendedProducts();

  console.log(`Monitoring ${products.length} products`);

  cron.schedule(`*/10 * * * *`, async () => {
    try {
      const numProducts = await prisma.product.count();
      if (products.length !== numProducts) {
        const { products: newProducts, priceFromVariant: newPriceFromVariant } =
          await getExtendedProducts(products.length);

        products.push(...newProducts);
        newPriceFromVariant.forEach((price, id) => {
          console.log(`Adding ${id} to priceFromVariant`);
          priceFromVariant.set(id, price);
        });

        console.log(`Monitoring ${products.length} products`);
      }

      const start = Date.now();
      console.log(`Updating ${products.length} products`);

      await updateProducts(products, priceFromVariant);

      const elapsed = (Date.now() - start) / 1000;
      console.log(`Finished updating products in ${elapsed} seconds`);
    } catch (error) {
      console.error(`Error pinging products\n${error}`);
    }
  });
}

async function main() {
  const result = await testProxy();
  if (result.success) {
    console.log("Proxy is working");
  } else {
    console.warn(`Proxy is not working: ${result.error}`);
  }

  await setupMonitors().catch((error) => {
    console.error(`Error setting up monitors\n${error}`);
  });
}

void main();
