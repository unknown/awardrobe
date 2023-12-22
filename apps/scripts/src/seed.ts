import { AbercrombieUS, downloadImage, ProductDetails, UniqloUS } from "@awardrobe/adapters";
import { addProductImage } from "@awardrobe/media-store";
import { meilisearch, Product } from "@awardrobe/meilisearch-types";
import { prisma } from "@awardrobe/prisma-types";

async function seedUniqloUS() {
  console.log("Seeding Uniqlo US");
  const uniqlo = await prisma.store.upsert({
    where: { handle: "uniqlo-us" },
    update: {},
    create: {
      name: "Uniqlo US",
      shortenedName: "Uniqlo",
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
    const details = await UniqloUS.getProductDetails(productCode).catch((error) => {
      console.error(`Failed to get product details for ${productCode}\n${error}`);
      return null;
    });

    if (!details) {
      continue;
    }

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
      shortenedName: "Abercrombie",
      handle: "abercrombie-us",
      externalUrl: "https://www.abercrombie.com/",
    },
  });

  const productCodes = ["511064"];

  for (const productCode of productCodes) {
    const details = await AbercrombieUS.getProductDetails(productCode).catch((error) => {
      console.error(`Failed to get product details for ${productCode}\n${error}`);
      return null;
    });

    if (!details) {
      continue;
    }

    await addProduct(abercrombie.id, productCode, details);
  }
}

async function populateMeilisearch() {
  console.log("Populating Meilisearch");

  const products = await prisma.product.findMany({ include: { store: true } });

  const productDocuments: Product[] = products.map(({ id, name, store }) => ({
    id,
    name,
    storeName: store.name,
  }));

  await meilisearch.index("products").deleteAllDocuments();
  await meilisearch.index("products").addDocuments(productDocuments, { primaryKey: "id" });
}

async function main() {
  await seedUniqloUS();
  await seedAbercrombieUS();
  await populateMeilisearch();
}

async function addProduct(storeId: string, productCode: string, details: ProductDetails) {
  const { name, variants, imageUrl } = details;

  const product = await prisma.product.upsert({
    where: { storeId_productCode: { storeId, productCode } },
    update: {},
    create: {
      productCode,
      name,
      storeId,
      variants: {
        createMany: {
          data: variants.map(({ attributes, productUrl }) => ({
            attributes,
            productUrl,
          })),
        },
      },
    },
  });

  if (!imageUrl) {
    console.log(`No image found for ${productCode}`);
    return;
  }

  await downloadImage(imageUrl)
    .then(async (imageBuffer) => addProductImage(product.id, imageBuffer))
    .catch(() => console.error(`Failed to add image for ${productCode}`));
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
