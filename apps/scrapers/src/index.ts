import "dotenv/config";

import { AbercrombieUS, testProxy, UniqloUS } from "@awardrobe/adapters";

async function main() {
  try {
    await testProxy();
    console.log("Proxy is working");
  } catch (error) {
    console.warn(`Proxy is not working: ${error}`);
  }

  const limit = 120;

  const uniqloProducts = await UniqloUS.getProducts(limit);
  console.log(uniqloProducts, uniqloProducts.length);

  const abercrombieProducts = await AbercrombieUS.getProducts(limit);
  console.log(abercrombieProducts, abercrombieProducts.length);
}

void main();
