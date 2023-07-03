import { UniqloUS } from "@awardrobe/adapters";

import "dotenv/config";

import prisma from "./utils/database";

async function main() {
  const store = await prisma.store.findUniqueOrThrow({
    where: {
      handle: "uniqlo-us",
    },
  });

  const limit = 100;
  let total = 100;

  for (let offset = 0; offset < total; offset += limit) {
    const result = await UniqloUS.getProducts(offset, limit);

    const { products } = result;

    for (const product of products) {
      const { productCode, name, styles, sizes } = product;

      await prisma.product.upsert({
        where: {
          storeId_productCode: {
            storeId: store.id,
            productCode,
          },
        },
        update: {},
        create: {
          storeId: store.id,
          productCode,
          name,
          variants: {
            createMany: {
              data: styles.flatMap((style) =>
                sizes.map((size) => ({
                  style: style.stylizedName,
                  size: size.stylizedName,
                })),
              ),
            },
          },
        },
      });

      console.log(`Added product ${name} - ${productCode}`);
    }
  }
}

void main();
