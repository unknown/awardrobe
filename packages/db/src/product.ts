import { and, count, desc, eq, inArray } from "drizzle-orm";

import { ProductDetails } from "@awardrobe/adapters";

import { db } from "./db";
import { createProductVariants } from "./product-variant";
import { productNotifications } from "./schema/product-notifications";
import { products } from "./schema/products";
import type { FullProduct, Product, ProductWithBrand, Public } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

export type CreateProductOptions = {
  collectionId: number;
  productDetails: ProductDetails;
};

export async function createProduct(options: CreateProductOptions): Promise<Product> {
  const { collectionId, productDetails } = options;

  const productTable = await db.insert(products).values({
    collectionId,
    name: productDetails.name,
    externalProductId: productDetails.productId,
    publicId: generatePublicId(),
  });

  const product = await db.query.products.findFirst({
    where: eq(products.id, Number(productTable.insertId)),
  });

  if (!product) {
    throw new Error("Could not create product");
  }

  await createProductVariants({
    productId: product.id,
    variants: productDetails.variants,
  });

  return product;
}

export type FindProductOptions = {
  collectionId: number;
  externalProductId: string;
};

export async function findProduct(options: FindProductOptions): Promise<Product | null> {
  const { collectionId, externalProductId } = options;

  const existingProduct = await db.query.products.findFirst({
    where: and(
      eq(products.collectionId, collectionId),
      eq(products.externalProductId, externalProductId),
    ),
  });

  return existingProduct ?? null;
}

export type FindProductByPublicIdOptions = {
  productPublicId: string;
};

export async function findProductByPublicId(options: FindProductByPublicIdOptions) {
  const { productPublicId } = options;

  const existingProduct = await db.query.products.findFirst({
    where: eq(products.publicId, productPublicId),
    with: {
      variants: { with: { product: true } },
      collection: { with: { brand: true } },
    },
  });

  return existingProduct ?? null;
}

export function findListedProducts(): Promise<Product[]> {
  // TODO: only return products that have at least one variant that is listed
  return db.query.products.findMany();
}

export type FindFeaturedFeedProductsOptions = {
  limit?: number;
};

export function findFeaturedFeedProducts(options: FindFeaturedFeedProductsOptions) {
  const { limit } = options;

  return db.query.products.findMany({
    limit,
    orderBy: (products) =>
      desc(
        db
          .select({ count: count() })
          .from(productNotifications)
          .where(eq(productNotifications.productId, products.id)),
      ),
    with: { collection: { with: { brand: true } } },
  });
}

export type FindFollowingFeedProductsOptions = {
  userId: string;
  limit?: number;
};

export function findFollowingFeedProducts(options: FindFollowingFeedProductsOptions) {
  const { userId, limit } = options;

  return db.query.products.findMany({
    limit,
    where: (products) =>
      inArray(
        products.id,
        db
          .selectDistinct({ productId: productNotifications.productId })
          .from(productNotifications)
          .where(eq(productNotifications.userId, userId)),
      ),
    with: { collection: { with: { brand: true } } },
  });
}

export type FindFollowingProductsOptions = {
  userId: string;
  productPublicIds?: string[];
  withNotifiedVariants?: boolean;
};

export function findFollowingProducts(options: FindFollowingProductsOptions) {
  const { userId, productPublicIds, withNotifiedVariants } = options;

  return db.query.products.findMany({
    where: (products) =>
      and(
        productPublicIds ? inArray(products.publicId, productPublicIds) : undefined,
        inArray(
          products.id,
          db
            .selectDistinct({ productId: productNotifications.productId })
            .from(productNotifications)
            .where(eq(productNotifications.userId, userId)),
        ),
      ),
    with: {
      variants: withNotifiedVariants
        ? {
            where: (variants) =>
              inArray(
                variants.id,
                db
                  .selectDistinct({ variantId: productNotifications.productVariantId })
                  .from(productNotifications)
                  .where(eq(productNotifications.userId, userId)),
              ),
          }
        : undefined,
    },
  });
}

export type FindProductWithVariantsOptions = {
  collectionId: number;
};

export function findCollectionProducts(options: FindProductWithVariantsOptions) {
  const { collectionId } = options;

  return db.query.products.findMany({
    where: eq(products.collectionId, collectionId),
    with: {
      variants: { with: { product: true } },
      collection: { with: { brand: true } },
    },
  });
}
