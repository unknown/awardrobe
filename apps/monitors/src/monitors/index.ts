import { AdaptersError, getAdapter, PriceDatum } from "@awardrobe/adapters";
import {
  createProduct,
  findBrand,
  findOrCreateCollection,
  findOrCreateProductVariantListing,
  findOrCreateStoreListing,
  findProduct,
  Price,
  Store,
  StoreListingWithStore,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import {
  handleDelistedListing,
  handleOutdatedVariant,
  handlePriceDrop,
  handleRestock,
} from "./callbacks";

// TODO: relocate this?
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL");
}
const revalidateUrl = new URL("/api/products/revalidate", baseUrl);

export async function insertStoreListing(externalListingId: string, store: Store): Promise<void> {
  const adapter = getAdapter(store.handle);
  if (!adapter) {
    throw new Error(`No adapter found for ${store.handle}`);
  }

  const details = await adapter.getListingDetails(externalListingId).catch(async (error) => {
    if (error instanceof AdaptersError) {
      if (error.name === "PRODUCT_NOT_FOUND") {
        console.error(`Product ${externalListingId} not found`);
        return null;
      } else if (error.name === "INVALID_RESPONSE") {
        console.error(error);
        return null;
      }
    }
    throw error;
  });

  if (!details) {
    return;
  }

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

      const revalidatePromise = fetch(revalidateUrl.toString());

      await Promise.allSettled([addProductToSearchPromise, addImagePromise, revalidatePromise]);
    }

    const storeListing = await findOrCreateStoreListing({ externalListingId, storeId: store.id });
    const typedProduct = product; // hack to allow typescript to type product as non-null

    await Promise.all(
      productDetails.variants.map((variantDetails) =>
        findOrCreateProductVariantListing({
          variantDetails,
          productId: typedProduct.id,
          storeListingId: storeListing.id,
        }),
      ),
    );
  }
}

export async function pollStoreListing(listing: StoreListingWithStore) {
  const adapter = getAdapter(listing.store.handle);
  if (!adapter) {
    throw new Error(`No adapter found for ${listing.store.handle}`);
  }

  const details = await adapter
    .getListingDetails(listing.externalListingId)
    .catch(async (error) => {
      if (error instanceof AdaptersError) {
        if (error.name === "PRODUCT_NOT_FOUND") {
          await handleDelistedListing({ listing });
          return null;
        } else if (error.name === "INVALID_RESPONSE") {
          // TODO: log this better
          console.error(error);
          return null;
        }
      }
      throw error;
    });

  if (!details) {
    return;
  }

  const brand = await findBrand({ brandHandle: details.brand });
  if (!brand) {
    throw new Error(`Brand ${details.brand} not found`);
  }

  const collection = await findOrCreateCollection({
    externalCollectionId: details.collectionId,
    brandId: brand.id,
  });

  const allHandlers: Promise<void>[] = [];
  details.products.forEach(async (productDetails) => {
    const product = await findProduct({
      collectionId: collection.id,
      externalProductId: productDetails.productId,
    });

    if (!product) {
      // TODO: create the product
      console.error(`Product ${productDetails.productId} not found`);
      return;
    }

    productDetails.variants.forEach(async (variantDetails) => {
      const productVariantListing = await findOrCreateProductVariantListing({
        variantDetails,
        productId: product.id,
        storeListingId: listing.id,
      });

      const flags = getFlags(variantDetails.price, productVariantListing.latestPrice);

      if (flags.isOutdated) {
        allHandlers.push(handleOutdatedVariant({ variantDetails, productVariantListing }));
      }
      if (flags.hasPriceDropped) {
        allHandlers.push(handlePriceDrop({ product, variantDetails, productVariantListing }));
      }
      if (flags.hasRestocked) {
        allHandlers.push(handleRestock({ product, variantDetails, productVariantListing }));
      }
    });
  });

  await Promise.allSettled(allHandlers);
}

function getFlags(price: PriceDatum, latestPrice: Price | null) {
  if (!latestPrice) {
    return {
      hasPriceDropped: false,
      hasRestocked: false,
      isOutdated: true,
    };
  }

  const diffTime = price.timestamp.getTime() - latestPrice.timestamp.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  const isStale = diffHours >= 12;

  const hasPriceChanged = price.priceInCents !== latestPrice.priceInCents;
  const hasPriceDropped = price.priceInCents < latestPrice.priceInCents;

  const hasStockChanged = price.inStock !== latestPrice.inStock;
  const hasRestocked = price.inStock && !latestPrice.inStock;

  const isOutdated = isStale || hasPriceChanged || hasStockChanged;

  return {
    hasPriceDropped,
    hasRestocked,
    isOutdated,
  };
}
