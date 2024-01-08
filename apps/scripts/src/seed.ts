import { downloadImage, ProductDetails, UniqloUS } from "@awardrobe/adapters";
import {
  and,
  createProduct,
  createProductVariants,
  createStore,
  db,
  eq,
  findStore,
  schema,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { meilisearch, Product } from "@awardrobe/meilisearch-types";

async function populateMeilisearch() {
  console.log("Populating Meilisearch");

  const products = await db.query.products.findMany({ with: { store: true } });

  const productDocuments: Product[] = products.map(({ publicId, name, store }) => ({
    name,
    id: publicId,
    storeName: store.name,
  }));

  await meilisearch.index("products").deleteAllDocuments();
  await meilisearch.index("products").addDocuments(productDocuments, { primaryKey: "id" });
}

async function addProduct(storeId: number, productCode: string, details: ProductDetails) {
  const existingProduct = await db.query.products.findFirst({
    where: and(eq(schema.products.storeId, storeId), eq(schema.products.productCode, productCode)),
  });

  if (existingProduct) {
    console.log(`Product ${productCode} already exists`);
    return;
  }

  const product = await createProduct({
    productCode,
    storeId,
    name: details.name,
  });

  await createProductVariants({
    productId: product.id,
    variantInfos: details.variants,
  });

  if (details.imageUrl) {
    await downloadImage(details.imageUrl)
      .then(async (imageBuffer) => addProductImage(product.publicId, imageBuffer))
      .catch(() => console.error(`Failed to add image for ${productCode}`));
  } else {
    console.log(`No image found for ${productCode}`);
  }

  return product;
}

async function seedUniqloUS() {
  console.log("Seeding Uniqlo US");

  const uniqlo = await findStore({ storeHandle: "uniqlo-us" });
  if (!uniqlo) {
    throw new Error("Could not find Uniqlo US store");
  }

  const productCodes = [
    "E459592-000",
    "E462197-000",
    "E465185-000",
    "E460662-000",
    "E464854-000",
    "E463996-000",
  ];

  for (const productCode of productCodes) {
    const details = await UniqloUS.getProductDetails(productCode).catch((error) => {
      console.error(`Failed to get product details for ${productCode}\n${error}`);
      return null;
    });

    if (!details) {
      continue;
    }

    const product = await addProduct(uniqlo.id, productCode, details);
    if (product) {
      console.log(`Added ${product.name} for ${uniqlo.name}`);
    }
  }
}

async function seedStores() {
  const stores = [
    {
      handle: "uniqlo-us",
      name: "Uniqlo US",
      shortenedName: "Uniqlo",
      externalUrl: "https://www.uniqlo.com/us/en/",
    },
    {
      handle: "abercrombie-us",
      name: "Abercrombie & Fitch US",
      shortenedName: "Abercrombie",
      externalUrl: "https://www.abercrombie.com/shop/us",
    },
    {
      handle: "zara-us",
      name: "Zara US",
      shortenedName: "Zara",
      externalUrl: "https://www.zara.com/us/",
    },
    {
      handle: "jcrew-us",
      name: "J.Crew US",
      shortenedName: "J.Crew",
      externalUrl: "https://www.jcrew.com/",
    },
    {
      handle: "levis-us",
      name: "Levi's US",
      shortenedName: "Levi's",
      externalUrl: "https://www.levi.com/US/en_US/",
    },
  ];

  return Promise.allSettled(
    stores.map(async (store) => {
      const existingStore = await findStore({ storeHandle: store.handle });

      if (existingStore) {
        return;
      }

      await createStore(store);
      console.log(`Added store ${store.name}`);
    }),
  );
}

async function main() {
  await seedStores();
  await seedUniqloUS();
  await populateMeilisearch();
}

void main();
