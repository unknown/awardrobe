import { and, count, desc, eq, exists, inArray, notExists } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariants } from "./schema/product-variants";
import { products } from "./schema/products";
import type { FullProduct, Product, ProductWithStore, Public } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

export type CreateProductOptions = {
  name: string;
  productCode: string;
  storeId: number;
};

export async function createProduct(options: CreateProductOptions): Promise<Product> {
  const { name, productCode, storeId } = options;

  const productTable = await db.insert(products).values({
    name,
    productCode,
    storeId,
    publicId: generatePublicId(),
  });

  const created = await db.query.products.findFirst({
    where: eq(products.id, Number(productTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create product");
  }

  return created;
}

export type FindProductOptions = {
  productId: number;
};

export function findProduct(options: FindProductOptions): Promise<Product | undefined> {
  const { productId } = options;

  return db.query.products.findFirst({
    where: eq(products.id, productId),
  });
}

export async function findFrequentProducts(): Promise<ProductWithStore[]> {
  return db.query.products.findMany({
    where: (products) =>
      exists(
        db
          .select()
          .from(productNotifications)
          .where(eq(productNotifications.productId, products.id)),
      ),
    with: { store: true },
  });
}

export async function findPeriodicProducts(): Promise<ProductWithStore[]> {
  return db.query.products.findMany({
    where: (products) =>
      notExists(
        db
          .select()
          .from(productNotifications)
          .where(eq(productNotifications.productId, products.id)),
      ),
    with: { store: true },
  });
}

export type FindProductsWithUsersNotificationsOptions = {
  userId: string;
  productIds?: number[];
};

export function findProductsWithUsersNotifications(
  options: FindProductsWithUsersNotificationsOptions,
) {
  const { userId, productIds } = options;

  return db.query.products.findMany({
    where: and(
      exists(db.select().from(productNotifications).where(eq(productNotifications.userId, userId))),
      productIds ? inArray(products.id, productIds) : undefined,
    ),
  });
}

export type FindFeaturedProductsOptions = {
  limit?: number;
};

export function findFeaturedProducts(
  options: FindFeaturedProductsOptions = {},
): Promise<ProductWithStore[]> {
  const { limit = 24 } = options;

  return db.query.products.findMany({
    limit,
    orderBy: (products) =>
      desc(
        db
          .select({ value: count() })
          .from(productNotifications)
          .where(eq(productNotifications.productId, products.id)),
      ),
    with: { store: true },
  });
}

export type FindProductPublicOptions = {
  productCode: string;
  storeId: number;
};

export function findProductPublic(
  options: FindProductPublicOptions,
): Promise<Public<Product> | undefined> {
  const { productCode, storeId } = options;

  return db.query.products.findFirst({
    where: and(eq(products.productCode, productCode), eq(products.storeId, storeId)),
    columns: { id: false, storeId: false },
  });
}

export type FindProductsByProductCodesOptions = {
  productCodes: string[];
  storeId: number;
};

export function findProductsByProductCodes(
  options: FindProductsByProductCodesOptions,
): Promise<Product[]> {
  const { productCodes, storeId } = options;

  return db.query.products.findMany({
    where: and(inArray(products.productCode, productCodes), eq(products.storeId, storeId)),
  });
}

export type FindFollowingProductsOptions = {
  userId: string;
  productPublicIds?: string[];
  withStore?: boolean;
  withNotifiedVariants?: boolean;
};

export function findFollowingProducts(options: FindFollowingProductsOptions) {
  const { userId, productPublicIds, withStore, withNotifiedVariants } = options;

  return db.query.products.findMany({
    where: (products) =>
      and(
        productPublicIds ? inArray(products.publicId, productPublicIds) : undefined,
        exists(
          db
            .select()
            .from(productVariants)
            .where(
              and(
                eq(products.id, productVariants.productId),
                exists(
                  db
                    .select()
                    .from(productNotifications)
                    .where(
                      and(
                        eq(productNotifications.userId, userId),
                        eq(productVariants.id, productNotifications.productVariantId),
                      ),
                    ),
                ),
              ),
            ),
        ),
      ),
    with: {
      store: withStore || undefined,
      variants: withNotifiedVariants
        ? {
            where: (variants) =>
              exists(
                db
                  .select()
                  .from(productNotifications)
                  .where(
                    and(
                      eq(productNotifications.userId, userId),
                      eq(variants.id, productNotifications.productVariantId),
                    ),
                  ),
              ),
          }
        : undefined,
    },
  });
}

export type FindProductWithVariantsOptions = {
  productPublicId: string;
};

export function findFullProductPublic(
  options: FindProductWithVariantsOptions,
): Promise<Public<FullProduct> | undefined> {
  const { productPublicId } = options;

  return db.query.products.findFirst({
    where: eq(products.publicId, productPublicId),
    columns: { id: false, storeId: false },
    with: {
      variants: { columns: { id: false, latestPriceId: false, productId: false } },
      store: { columns: { id: false } },
    },
  });
}
