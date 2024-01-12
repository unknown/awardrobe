import { ListingDetails, UniqloUS } from "@awardrobe/adapters";
import {
  createBrand,
  createProduct,
  createProductVariantListing,
  createStore,
  createStoreListing,
  db,
  findBrand,
  findOrCreateCollection,
  findProduct,
  findStore,
  findStoreListings,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct, meilisearch, Product } from "@awardrobe/meilisearch-types";

const stores = [
  { handle: "uniqlo-us", name: "Uniqlo US", externalUrl: "https://www.uniqlo.com/us/en/" },
  {
    handle: "abercrombie-us",
    name: "Abercrombie & Fitch US",
    externalUrl: "https://www.abercrombie.com/shop/us",
  },
  { handle: "zara-us", name: "Zara US", externalUrl: "https://www.zara.com/us/" },
  { handle: "jcrew-us", name: "J.Crew US", externalUrl: "https://www.jcrew.com/" },
  { handle: "levis-us", name: "Levi's US", externalUrl: "https://www.levi.com/US/en_US/" },
];
const brands = [
  { name: "Uniqlo", handle: "uniqlo", externalUrl: "https://www.uniqlo.com/" },
  {
    name: "Abercrombie & Fitch",
    handle: "abercrombie",
    externalUrl: "https://www.abercrombie.com/",
  },
  { name: "Zara", handle: "zara", externalUrl: "https://www.zara.com/" },
  { name: "J.Crew", handle: "jcrew", externalUrl: "https://www.jcrew.com/" },
  { name: "Levi's", handle: "levis", externalUrl: "https://www.levi.com/" },
];

async function populateMeilisearch() {
  const products = await db.query.products.findMany({
    with: { collection: { with: { brand: true } } },
  });

  const productDocuments: Product[] = products.map(({ publicId, name, collection }) => ({
    name,
    id: publicId,
    brand: collection.brand.name,
  }));

  await meilisearch.index("products").deleteAllDocuments();
  await meilisearch.index("products").addDocuments(productDocuments, { primaryKey: "id" });

  console.log(`Added ${productDocuments.length} products to Meilisearch`);
}

async function addListing(storeId: number, listingId: string, details: ListingDetails) {
  const brand = await findBrand({ brandHandle: details.brand });
  if (!brand) {
    throw new Error(`Brand ${details.brand} not found`);
  }

  const collection = await findOrCreateCollection({
    externalCollectionId: details.collectionId,
    brandId: brand.id,
  });

  for (const productDetails of details.products) {
    let product = await findProduct({
      collectionId: collection.id,
      externalProductId: productDetails.productId,
    });

    if (!product) {
      product = await createProduct({
        productDetails,
        collectionId: collection.id,
      });

      const addProductToSearchPromise = addProduct({
        id: product.publicId,
        name: product.name,
        brand: brand.name,
      });

      const addImagePromise = productDetails.imageUrl
        ? addProductImage(product.publicId, productDetails.imageUrl)
        : undefined;

      await Promise.allSettled([addProductToSearchPromise, addImagePromise]);
    }

    const storeListing = await createStoreListing({
      externalListingId: listingId,
      storeId: storeId,
    });
    const typedProduct = product; // hack to allow typescript to type product as non-null

    await Promise.all(
      productDetails.variants.map((variantDetails) =>
        createProductVariantListing({
          variantDetails,
          productId: typedProduct.id,
          storeListingId: storeListing.id,
        }),
      ),
    );
  }
}

async function seedUniqloUS() {
  console.log("Seeding Uniqlo US");

  const uniqlo = await findStore({ storeHandle: "uniqlo-us" });
  if (!uniqlo) {
    throw new Error("Could not find Uniqlo US store");
  }

  const listingIds = [
    "E459592-000",
    "E462197-000",
    "E465185-000",
    "E460662-000",
    "E464854-000",
    "E463996-000",
  ];

  const existingListings = await findStoreListings({
    externalListingIds: listingIds,
    storeId: uniqlo.id,
  });

  const newListingIds = listingIds.filter(
    (listingId) => !existingListings.some((listing) => listing.externalListingId === listingId),
  );

  for (const listingId of newListingIds) {
    const details = await UniqloUS.getListingDetails(listingId).catch((error) => {
      console.error(`Failed to get listing details for ${listingId}\n${error}`);
      return null;
    });

    if (!details) {
      continue;
    }

    await addListing(uniqlo.id, listingId, details);

    console.log(`Added ${details.collectionId} to Uniqlo US`);
  }
}

async function seedStores() {
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

async function seedBrands() {
  return Promise.allSettled(
    brands.map(async (brand) => {
      const existingBrand = await findBrand({ brandHandle: brand.handle });

      if (existingBrand) {
        return;
      }

      await createBrand(brand);
      console.log(`Added brand ${brand.name}`);
    }),
  );
}

async function main() {
  await seedStores();
  await seedBrands();
  await seedUniqloUS();
  await populateMeilisearch();
}

void main();
