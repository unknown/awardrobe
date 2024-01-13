import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariants } from "./schema/product-variants";
import { products } from "./schema/products";
import { NotificationWithUser, NotificationWithVariant, Public } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

export type CreateNotificationOptions = {
  userId: string;
  productId: number;
  productVariantId: number;
  priceInCents: number;
  priceDrop: boolean;
  restock: boolean;
};

export async function createNotification(
  options: CreateNotificationOptions,
): Promise<Public<NotificationWithVariant>> {
  const { userId, productId, productVariantId, priceInCents, priceDrop, restock } = options;

  const notificationsTable = await db.insert(productNotifications).values({
    userId,
    priceInCents,
    priceDrop,
    restock,
    productId,
    productVariantId,
    publicId: generatePublicId(),
  });

  const created = await db.query.productNotifications.findFirst({
    where: eq(productNotifications.id, Number(notificationsTable.insertId)),
    columns: { id: false, productVariantId: false, productId: false },
    with: { productVariant: { columns: { id: false, productId: false } } },
  });

  if (!created) {
    throw new Error("Could not create notification");
  }

  return created;
}

export type FindUserNotificationOptions = {
  userId: string;
  productPublicId: string;
};

export async function findUserNotifications(
  options: FindUserNotificationOptions,
): Promise<Public<NotificationWithVariant>[]> {
  const { userId, productPublicId } = options;

  const product = await db.query.products.findFirst({
    where: eq(products.publicId, productPublicId),
  });

  if (!product) {
    throw new Error("Product does not exist");
  }

  return db.query.productNotifications.findMany({
    where: (productNotifications) =>
      and(
        eq(productNotifications.userId, userId),
        inArray(
          productNotifications.productVariantId,
          db
            .selectDistinct({ productVariantId: productVariants.id })
            .from(productVariants)
            .where(
              inArray(
                productVariants.productId,
                db
                  .selectDistinct({ productId: products.id })
                  .from(products)
                  .where(eq(products.collectionId, product.collectionId)),
              ),
            ),
        ),
      ),
    columns: { id: false, productId: false, productVariantId: false },
    with: { productVariant: { columns: { id: false, productId: false } } },
  });
}

export type FindNotificationsByProductOptions = {
  productId: number;
};

export function findNotificationsByProduct(
  options: FindNotificationsByProductOptions,
): Promise<NotificationWithUser[]> {
  const { productId } = options;

  return db.query.productNotifications.findMany({
    where: eq(productNotifications.productId, productId),
    with: { user: true },
  });
}

export type FindNotificationsOptions = {
  variantId: number;
  priceInCents: number;
};

export function findPriceDropNotifications(
  options: FindNotificationsOptions,
): Promise<NotificationWithUser[]> {
  const { variantId, priceInCents } = options;
  const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);

  return db.query.productNotifications.findMany({
    where: and(
      eq(productNotifications.priceDrop, true),
      eq(productNotifications.productVariantId, variantId),
      gte(productNotifications.priceInCents, priceInCents),
      or(
        isNull(productNotifications.lastPriceDropPing),
        gte(productNotifications.lastPriceDropPing, yesterday),
      ),
    ),
    with: { user: true },
  });
}

export function findRestockNotifications(
  options: FindNotificationsOptions,
): Promise<NotificationWithUser[]> {
  const { variantId, priceInCents } = options;
  const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);

  return db.query.productNotifications.findMany({
    where: and(
      eq(productNotifications.restock, true),
      eq(productNotifications.productVariantId, variantId),
      gte(productNotifications.priceInCents, priceInCents),
      or(
        isNull(productNotifications.lastRestockPing),
        gte(productNotifications.lastRestockPing, yesterday),
      ),
    ),
    with: { user: true },
  });
}

export type UpdateNotificationLastPingOptions = {
  notificationIds: number[];
};

export async function updatePriceDropLastPing(
  options: UpdateNotificationLastPingOptions,
): Promise<void> {
  const { notificationIds } = options;
  const now = new Date();

  if (notificationIds.length === 0) {
    return;
  }

  await db
    .update(productNotifications)
    .set({ lastPriceDropPing: now })
    .where(inArray(productNotifications.id, notificationIds));
}

export async function updateRestockLastPing(
  options: UpdateNotificationLastPingOptions,
): Promise<void> {
  const { notificationIds } = options;
  const now = new Date();

  if (notificationIds.length === 0) {
    return;
  }

  await db
    .update(productNotifications)
    .set({ lastRestockPing: now })
    .where(inArray(productNotifications.id, notificationIds));
}

type DeleteNotificationOptions = {
  userId: string;
  notificationPublicId: string;
};

export async function deleteNotification(options: DeleteNotificationOptions) {
  const { notificationPublicId } = options;

  await db
    .delete(productNotifications)
    .where(eq(productNotifications.publicId, notificationPublicId));
}
