import { AdaptersError, getAdapter, PriceDatum, VariantDetails } from "@awardrobe/adapters";
import {
  createLatestPrice,
  createProduct,
  createProductVariantListing,
  findBrand,
  findFrequentStoreListings,
  findOrCreateCollection,
  findOrCreateProductVariantListing,
  findOrCreateStoreListing,
  findPeriodicStoreListings,
  findPriceDropNotifications,
  findProduct,
  findRestockNotifications,
  findStoreListingPollData,
  findStoreListingsFromExternalIds,
  findStores,
  updatePriceDropLastPing,
  updateRestockLastPing,
  updateStoreListings,
} from "@awardrobe/db";
import type { Price, Product, ProductVariantListing, Store, StoreListing } from "@awardrobe/db";
import { PriceNotificationEmail, render, resend, StockNotificationEmail } from "@awardrobe/emails";
import { logger, logsnag } from "@awardrobe/logger";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import { boss } from "../utils/pgboss";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL");
}
const revalidateUrl = new URL("/api/products/revalidate", baseUrl);

export async function pollStoreListingsFrequent() {
  const listings = await findFrequentStoreListings();

  await boss.insert(
    listings.map((listing) => ({
      name: "poll-store-listing",
      data: { storeListingId: listing.id },
      singletonKey: listing.id.toString(),
      priority: 10,
      expireInSeconds: 3 * 60 * 60,
    })),
  );

  logger.info(`Polling ${listings.length} store listings (frequent)`);
}

export async function pollStoreListingsPeriodic() {
  const listings = await findPeriodicStoreListings();

  await boss.insert(
    listings.map((listing) => ({
      name: "poll-store-listing",
      data: { storeListingId: listing.id },
      singletonKey: listing.id.toString(),
      expireInSeconds: 3 * 60 * 60,
    })),
  );

  logger.info(`Polling ${listings.length} store listings (periodic)`);
}

export async function pollStoreListing(storeListingId: number) {
  const listing = await findStoreListingPollData({ storeListingId });

  if (!listing) {
    throw new Error(`Failed to find listing ${storeListingId}`);
  }

  const adapter = getAdapter(listing.store.handle);
  if (!adapter) {
    throw new Error(`No adapter found for ${listing.store.handle}`);
  }

  const details = await adapter
    .getListingDetails(listing.externalListingId)
    .catch(async (error) => {
      if (error instanceof AdaptersError) {
        if (error.name === "PRODUCT_NOT_FOUND") {
          await handleDelistedListing(listing);
          return null;
        } else if (error.name === "INVALID_RESPONSE") {
          logger.error(error);
          logsnag.track({
            channel: "errors",
            event: "Invalid product details response",
            tags: {
              environment: process.env.NODE_ENV === "production" ? "production" : "development",
            },
            notify: true,
          });
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
    const product = await findProduct({
      collectionId: collection.id,
      externalProductId: productDetails.productId,
    });

    if (!product) {
      // TODO: create the product
      logger.error(`Product ${productDetails.productId} not found`);
      continue;
    }

    for (const variantDetails of productDetails.variants) {
      const productVariantListing = listing.productVariantListings.find(
        (listing) =>
          JSON.stringify(listing.productVariant.attributes) ===
          JSON.stringify(variantDetails.attributes),
      );

      if (!productVariantListing) {
        logger.info(
          `Creating new variant for ${product.name}: ${JSON.stringify(variantDetails.attributes)}`,
        );

        await createProductVariantListing({
          productId: product.id,
          storeListingId: listing.id,
          variantDetails,
        });

        continue;
      }

      const flags = getFlags(variantDetails.price, productVariantListing.latestPrice);
      await Promise.all([
        flags.isOutdated ? handleOutdatedVariant(variantDetails, productVariantListing) : null,
        flags.hasPriceDropped
          ? handlePriceDrop(product, variantDetails, productVariantListing)
          : null,
        flags.hasRestocked
          ? handleRestock({ product, variantDetails, productVariantListing })
          : null,
      ]);
    }
  }
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

async function handleDelistedListing(listing: StoreListing) {
  logger.info(`Delisting ${listing.externalListingId}`);

  await updateStoreListings({ listingIds: [listing.id], active: false });

  // TODO: also send an email?
}

async function handleOutdatedVariant(
  variantDetails: VariantDetails,
  productVariantListing: ProductVariantListing,
) {
  await createLatestPrice({
    productVariantListingId: productVariantListing.id,
    price: variantDetails.price,
  });
}

async function handlePriceDrop(
  product: Product,
  variantDetails: VariantDetails,
  productVariantListing: ProductVariantListing,
) {
  const { attributes, price } = variantDetails;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`/product/${product.publicId}`, baseUrl);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  logger.info(`Price drop for ${product.name} - ${product.externalProductId} ${description}`);

  const notifications = await findPriceDropNotifications({
    variantId: productVariantListing.productVariantId,
    priceInCents: price.priceInCents,
  });

  if (notifications.length === 0) {
    return;
  }

  await updatePriceDropLastPing({
    notificationIds: notifications.map((notification) => notification.id),
  });

  const renderedEmail = await render(
    PriceNotificationEmail({
      description,
      productName: product.name,
      productUrl: url.toString(),
      priceInCents: price.priceInCents,
    }),
  );

  await Promise.allSettled(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Price drop",
        html: renderedEmail,
      });
    }),
  );
}

async function handleRestock(options: {
  product: Product;
  variantDetails: VariantDetails;
  productVariantListing: ProductVariantListing;
}) {
  const { product, variantDetails, productVariantListing } = options;
  const { attributes, price } = variantDetails;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`/product/${product.publicId}`, baseUrl);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  logger.info(`Restock for ${product.name} - ${product.externalProductId} ${description}`);

  const notifications = await findRestockNotifications({
    variantId: productVariantListing.productVariantId,
    priceInCents: price.priceInCents,
  });

  if (notifications.length === 0) {
    return;
  }

  await updateRestockLastPing({
    notificationIds: notifications.map((notification) => notification.id),
  });

  const renderedEmail = await render(
    StockNotificationEmail({
      description,
      productName: product.name,
      productUrl: url.toString(),
      priceInCents: price.priceInCents,
    }),
  );

  await Promise.allSettled(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Item back in stock",
        html: renderedEmail,
      });
    }),
  );
}

export async function updateStores() {
  const stores = await findStores();
  logger.debug(`Updating listings for ${stores.length} stores`);

  for (const store of stores) {
    const adapter = getAdapter(store.handle);

    if (!adapter) {
      console.error(`No adapter found for ${store.handle}`);
      continue;
    }

    const limit = process.env.NODE_ENV === "production" ? undefined : 10;
    const listingIds = await adapter.getListingIds(limit);
    if (listingIds.size === 0) {
      console.warn(`No products found for ${store.handle}`);
      continue;
    }

    const existingListings = await findStoreListingsFromExternalIds({
      storeId: store.id,
      externalListingIds: Array.from(listingIds),
    });

    const newExternalListingIds = new Set(listingIds);
    const reactivatedListingIds: number[] = [];
    existingListings.forEach((listing) => {
      if (!listing.active) {
        reactivatedListingIds.push(listing.id);
      }
      newExternalListingIds.delete(listing.externalListingId);
    });

    logger.info(
      `Inserting ${newExternalListingIds.size} listings and reactivating ${reactivatedListingIds.length} listings for ${store.handle}`,
    );

    await updateStoreListings({
      listingIds: reactivatedListingIds,
      active: true,
    });

    await boss.insert(
      Array.from(newExternalListingIds).map((externalListingId) => ({
        name: "insert-store-listing",
        data: { externalListingId, store },
        singletonKey: `${store.handle}:${externalListingId}`,
        expireInSeconds: 3 * 60 * 60,
      })),
    );
  }
}

export async function insertListing(externalListingId: string, store: Store) {
  const adapter = getAdapter(store.handle);
  if (!adapter) {
    throw new Error(`No adapter found for ${store.handle}`);
  }

  const details = await adapter.getListingDetails(externalListingId).catch(async (error) => {
    if (error instanceof AdaptersError) {
      if (error.name === "INVALID_RESPONSE") {
        logger.error(error);
        logsnag.track({
          channel: "errors",
          event: "Invalid product details response",
          tags: {
            environment: process.env.NODE_ENV === "production" ? "production" : "development",
          },
          notify: true,
        });
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

      await Promise.all([addProductToSearchPromise, addImagePromise, revalidatePromise]);
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

  logger.info(`Inserted ${externalListingId} for ${store.name}`);
}
