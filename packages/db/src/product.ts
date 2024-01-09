import { and, count, desc, eq, inArray, notInArray } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { products } from "./schema/products";
import type {
  FullProduct,
  Product,
  ProductWithStore,
  ProductWithStoreHandle,
  Public,
} from "./schema/types";
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

export async function findFrequentProducts(): Promise<ProductWithStoreHandle[]> {
  return db.query.products.findMany({
    where: (products) =>
      inArray(
        products.id,
        db.selectDistinct({ productId: productNotifications.productId }).from(productNotifications),
      ),
    with: { store: { columns: { handle: true } } },
  });
}

export async function findPeriodicProducts(): Promise<ProductWithStoreHandle[]> {
  return db.query.products.findMany({
    where: (products) =>
      notInArray(
        products.id,
        db.selectDistinct({ productId: productNotifications.productId }).from(productNotifications),
      ),
    with: { store: { columns: { handle: true } } },
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
          .select({ count: count() })
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
        inArray(
          products.id,
          db
            .selectDistinct({ productId: productNotifications.productId })
            .from(productNotifications)
            .where(eq(productNotifications.userId, userId)),
        ),
      ),
    with: {
      store: withStore ? true : undefined,
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

export type UpdateProductsDelistedOptions = {
  productIds: number[];
  delisted: boolean;
};

export async function updateProductsDelisted(
  options: UpdateProductsDelistedOptions,
): Promise<void> {
  const { productIds, delisted } = options;

  if (productIds.length === 0) {
    return;
  }

  await db.update(products).set({ delisted }).where(inArray(products.id, productIds));
}
