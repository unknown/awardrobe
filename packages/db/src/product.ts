import { and, desc, eq, exists, gte, inArray, lte } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariants } from "./schema/product-variants";
import { products } from "./schema/products";
import type { Product, ProductVariant, Store } from "./schema/types";

export type ProductWithStore = Product & { store: Store };

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

export function findNotifiedProducts(
  options: FindNotifiedProductsOptions = {},
): Promise<ProductWithStore[]> {
  const { numNotified } = options;

  return db.query.products.findMany({
    where: and(
      numNotified?.lte ? lte(products.numNotified, numNotified.lte) : undefined,
      numNotified?.gte ? gte(products.numNotified, numNotified.gte) : undefined,
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
    orderBy: desc(products.numNotified),
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
};

export function findFollowingProducts(options: FindFollowingProductsOptions): Promise<Product[]> {
  const { userId } = options;

  return db.query.products.findMany({
    where: exists(
      db
        .select()
        .from(productVariants)
        .where(
          exists(
            db.select().from(productNotifications).where(eq(productNotifications.userId, userId)),
          ),
        ),
    ),
  });
}

export type FullProduct = Product & {
  variants: ProductVariant[];
  store: Store;
};

export type FindProductWithVariantsOptions = {
  productId: number;
};

export async function findProductWithVariants(
  options: FindProductWithVariantsOptions,
): Promise<FullProduct | undefined> {
  const { productId } = options;

  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { variants: true, store: true },
  });
}
