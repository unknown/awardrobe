import { downloadImage, ProductDetails, UniqloUS } from "@awardrobe/adapters";
import { and, createProduct, createProductVariant, db, eq, schema } from "@awardrobe/db";
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

  if (!details.imageUrl) {
    console.log(`No image found for ${productCode}`);
    return;
  }

  await downloadImage(details.imageUrl)
    .then(async (imageBuffer) => addProductImage(product.id.toString(), imageBuffer))
    .catch(() => console.error(`Failed to add image for ${productCode}`));
}

async function seedUniqloUS() {
  console.log("Seeding Uniqlo US");

  const storesTable = await db
    .insert(schema.stores)
    .values({
      name: "Uniqlo US",
      shortenedName: "Uniqlo",
      handle: "uniqlo-us",
      externalUrl: "https://www.uniqlo.com/",
    })
    .onDuplicateKeyUpdate({ set: {} });

  const uniqlo = await db.query.stores.findFirst({
    where: eq(schema.stores.id, Number(storesTable.insertId)),
  });

  if (!uniqlo) {
    throw new Error("Failed to find Uniqlo");
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

    await addProduct(uniqlo.id, productCode, details);
  }
}

async function main() {
  await seedUniqloUS();
  await populateMeilisearch();
}

void main();
