import { downloadImage, ProductDetails, UniqloUS } from "@awardrobe/adapters";
import {
  and,
  createProduct,
  createProductVariant,
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

  const productDocuments: Product[] = products.map(({ id, name, store }) => ({
    id: id.toString(),
    name,
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

  await Promise.allSettled(
    details.variants.map(async (variantInfo) =>
      createProductVariant({ variantInfo, productId: product.id }),
    ),
  );

  if (details.imageUrl) {
    await downloadImage(details.imageUrl)
      .then(async (imageBuffer) => addProductImage(product.id.toString(), imageBuffer))
      .catch(() => console.error(`Failed to add image for ${productCode}`));
  } else {
    console.log(`No image found for ${productCode}`);
  }

  return product;
}

async function seedUniqloUS() {
  console.log("Seeding Uniqlo US");

  let uniqlo = await findStore({ storeHandle: "uniqlo-us" });
  if (!uniqlo) {
    uniqlo = await createStore({
      handle: "uniqlo-us",
      name: "Uniqlo US",
      shortenedName: "Uniqlo",
      externalUrl: "https://www.uniqlo.com/us/en/",
    });
  }

  if (!uniqlo) {
    throw new Error("Could not find or create Uniqlo US store");
  }

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

    const product = await addProduct(uniqlo.id, productCode, details);
    if (product) {
      console.log(`Added ${product.name} for ${uniqlo.name}`);
    }
  }
}

async function main() {
  await seedUniqloUS();
  await populateMeilisearch();
}

void main();
