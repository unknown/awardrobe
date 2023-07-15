import "dotenv/config";

import { AbercrombieUS, testProxy, UniqloUS } from "@awardrobe/adapters";

async function main() {
  try {
    await testProxy();
    console.log("Proxy is working");
  } catch (error) {
    console.warn(`Proxy is not working: ${error}`);
  }

  const limit = 1;

  const uniqloProductCodes = await UniqloUS.getProducts(limit);
  uniqloProductCodes.forEach(async (productCode) => {
    const { name, variants } = await UniqloUS.getProductDetails(productCode);
    console.log(
      name,
      variants.map((variant) => variant.attributes),
    );
  });

  const abercrombieProductCodes = await AbercrombieUS.getProducts(limit);
  abercrombieProductCodes.forEach(async (productCode) => {
    const { name, variants } = await AbercrombieUS.getProductDetails(productCode);
    console.log(
      name,
      variants.map((variant) => variant.attributes),
    );
  });
}

void main();
