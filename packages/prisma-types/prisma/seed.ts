import { PrismaClient } from "@prisma/client";

import { AbercrombieUS, UniqloUS, VariantAttribute } from "@awardrobe/adapters";

const prisma = new PrismaClient();

async function seedUniqloUS() {
  console.log("Seeding Uniqlo US");
  const uniqlo = await prisma.store.upsert({
    where: { handle: "uniqlo-us" },
    update: {},
    create: {
      name: "Uniqlo US",
      handle: "uniqlo-us",
      externalUrl: "https://www.uniqlo.com/",
    },
  });
  const productCodes = [
    "E457264-000",
    "E457967-000",
    "E453056-000",
    "E457263-000",
    "E457212-000",
    "E455498-000",
    "E450251-000",
  ];
  for (const productCode of productCodes) {
    const details = await UniqloUS.getProductDetails(productCode);
    await addProduct(uniqlo.id, productCode, details);
  }
}

async function seedAbercrombieUS() {
  console.log("Seeding Abercrombie & Fitch US");
  const abercrombie = await prisma.store.upsert({
    where: { handle: "abercrombie-us" },
    update: {},
    create: {
      name: "Abercrombie & Fitch US",
      handle: "abercrombie-us",
      externalUrl: "https://www.abercrombie.com/",
    },
  });

  const productCodes = ["519937"];

  for (const productCode of productCodes) {
    const details = await AbercrombieUS.getProductDetails(productCode);
    await addProduct(abercrombie.id, productCode, details);
  }
}

async function main() {
  await seedUniqloUS();
  await seedAbercrombieUS();
}

async function addProduct(
  storeId: string,
  productCode: string,
  productDetails: { name: string; variants: VariantAttribute[][] },
) {
  const { name, variants } = productDetails;
  await prisma.product.upsert({
    where: {
      storeId_productCode: { storeId, productCode },
    },
    update: {},
    create: {
      productCode,
      name,
      storeId,
      variants: {
        createMany: {
          data: variants.map((variant) => ({ attributes: variant })),
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
