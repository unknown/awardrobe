import { PrismaClient } from "@prisma/client";

import { UniqloUS } from "@awardrobe/adapters";

const prisma = new PrismaClient();

async function main() {
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
    await addProduct(uniqlo.id, productCode);
  }
}

async function addProduct(storeId: string, productCode: string) {
  const { name, variants } = await UniqloUS.getProductDetails(productCode);

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
