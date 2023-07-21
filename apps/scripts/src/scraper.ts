import "dotenv/config";

import { AbercrombieUS, UniqloUS } from "@awardrobe/adapters";
import { testProxies } from "@awardrobe/proxies";

async function main() {
  const { numSuccesses, numFailures } = await testProxies();
  console.log(`${numSuccesses} / ${numSuccesses + numFailures} proxies are working`);

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
