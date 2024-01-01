import { and, eq, exists, gte, inArray, isNull, or } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { productVariants } from "./schema/product-variants";
import { NotificationWithUser, ProductNotification } from "./schema/types";

export type CreateNotificationOptions = {
  variantId: number;
  userId: string;
  priceInCents: number;
  priceDrop: boolean;
  restock: boolean;
};

export async function createNotification(
  options: CreateNotificationOptions,
): Promise<ProductNotification> {
  const { variantId, userId, priceInCents, priceDrop, restock } = options;

  const productVariant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
  });

  if (!productVariant) {
    throw new Error("Product variant does not exist");
  }

  const notificationsTable = await db.insert(productNotifications).values({
    userId,
    priceInCents,
    priceDrop,
    restock,
    productVariantId: variantId,
    productId: productVariant.productId,
  });

  const created = await db.query.productNotifications.findFirst({
    where: eq(productNotifications.id, Number(notificationsTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create notification");
  }

  return created;
}

export type FindUserNotificationOptions = {
  userId: string;
  productId: number;
};

export function findUserNotifications(
  options: FindUserNotificationOptions,
): Promise<ProductNotification[]> {
  const { userId, productId } = options;

  return db.query.productNotifications.findMany({
    where: (productNotifications) =>
      and(
        eq(productNotifications.userId, userId),
        exists(
          db
            .select()
            .from(productVariants)
            .where(
              and(
                eq(productNotifications.productVariantId, productVariants.id),
                eq(productVariants.productId, productId),
              ),
            ),
        ),
      ),
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

  await db
    .update(productNotifications)
    .set({ lastRestockPing: now })
    .where(inArray(productNotifications.id, notificationIds));
}

type DeleteNotificationOptions = {
  notificationId: number;
};

export async function deleteNotification(options: DeleteNotificationOptions) {
  const { notificationId } = options;

  await db.delete(productNotifications).where(eq(productNotifications.id, notificationId));
}
