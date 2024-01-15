import { and, eq, gte } from "drizzle-orm";

import { VariantDetails } from "@awardrobe/adapters";

import { db } from "./db";
import { createLatestPrice } from "./price";
import { findOrCreateProductVariant } from "./product-variant";
import { prices } from "./schema/prices";
import { productVariantListings } from "./schema/product-variant-listings";
import { ProductVariantListing } from "./schema/types";

export type CreateProductVariantListingOptions = {
  productId: number;
  storeListingId: number;
  variantDetails: VariantDetails;
};

export async function createProductVariantListing(
  options: CreateProductVariantListingOptions,
): Promise<ProductVariantListing> {
  const { productId, storeListingId, variantDetails } = options;

  const productVariant = await findOrCreateProductVariant({
    productId,
    externalProductVariantId: variantDetails.variantId,
    variantAttributes: variantDetails.attributes,
  });

  const listingsTable = await db.insert(productVariantListings).values({
    storeListingId,
    productUrl: variantDetails.productUrl,
    productVariantId: productVariant.id,
  });

  const created = await db.query.productVariantListings.findFirst({
    where: eq(productVariantListings.id, Number(listingsTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create product variant listing");
  }

  await createLatestPrice({
    price: variantDetails.price,
    productVariantListingId: created.id,
  });

  return created;
}

export type FindOrCreateProductVariantListingOptions = {
  productId: number;
  storeListingId: number;
  variantDetails: VariantDetails;
};

export async function findOrCreateProductVariantListing(
  options: FindOrCreateProductVariantListingOptions,
): Promise<ProductVariantListing> {
  const { productId, storeListingId, variantDetails } = options;

  const productVariant = await findOrCreateProductVariant({
    productId,
    externalProductVariantId: variantDetails.variantId,
    variantAttributes: variantDetails.attributes,
  });

  const productVariantListing = await db.query.productVariantListings.findFirst({
    where: and(
      eq(productVariantListings.storeListingId, storeListingId),
      eq(productVariantListings.productVariantId, productVariant.id),
    ),
  });

  if (productVariantListing) {
    return productVariantListing;
  }

  return createProductVariantListing(options);
}

export type FindProductVariantListingsOptions = {
  productVariantId: number;
  pricesStartDate: Date;
};

export async function findProductVariantListings(options: FindProductVariantListingsOptions) {
  const { productVariantId, pricesStartDate } = options;

  return db.query.productVariantListings.findMany({
    where: eq(productVariantListings.productVariantId, productVariantId),
    with: {
      prices: { where: gte(prices.timestamp, pricesStartDate) },
      storeListing: { with: { store: true } },
    },
  });
}
