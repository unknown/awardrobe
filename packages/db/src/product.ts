import { and, count, desc, eq, exists, gte, inArray, lte } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariants } from "./schema/product-variants";
import { products } from "./schema/products";
import type { Product, ProductVariant, ProductWithStore, Store } from "./schema/types";

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

export type FindNotifiedProductsOptions = {
  numNotified?: { lte?: number; gte?: number };
};

export async function findNotifiedProducts(
  options: FindNotifiedProductsOptions = {},
): Promise<ProductWithStore[]> {
  const { numNotified } = options;

  return db.query.products.findMany({
    where: (products) =>
      and(
        numNotified?.lte
          ? lte(
              db
                .select({ value: count() })
                .from(productNotifications)
                .where(eq(productNotifications.productId, products.id)),
              numNotified.lte,
            )
          : undefined,
        numNotified?.gte
          ? gte(
              db
                .select({ value: count() })
                .from(productNotifications)
                .where(eq(productNotifications.productId, products.id)),
              numNotified.gte,
            )
          : undefined,
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

export type FindProductsByProductCodesOptions = {
  productCodes: string[];
  storeId: number;
};

export function findProductsByProductCodes(options: FindProductsByProductCodesOptions) {
  const { productCodes, storeId } = options;

  return db.query.products.findMany({
    where: and(inArray(products.productCode, productCodes), eq(products.storeId, storeId)),
  });
}

export type FindFollowingProductsOptions = {
  userId: string;
  productIds?: number[];
  withStore?: boolean;
  withNotifiedVariants?: boolean;
};

export function findFollowingProducts(options: FindFollowingProductsOptions) {
  const { userId, productIds, withStore, withNotifiedVariants } = options;

  return db.query.products.findMany({
    where: (products) =>
      and(
        productIds ? inArray(products.id, productIds) : undefined,
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

export type FullProduct = Product & {
  variants: ProductVariant[];
  store: Store;
};

export type FindProductWithVariantsOptions = {
  productId: number;
};

export function findProductWithVariants(
  options: FindProductWithVariantsOptions,
): Promise<FullProduct | undefined> {
  const { productId } = options;

  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { variants: true, store: true },
  });
}
