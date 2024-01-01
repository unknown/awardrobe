import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";

import { db } from "./db";
import { productNotifications } from "./schema/product-notifications";
import { ProductNotification, User } from "./schema/types";

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

  const notificationsTable = await db.insert(productNotifications).values({
    userId,
    priceInCents,
    priceDrop,
    restock,
    productVariantId: variantId,
  });

  // TODO: increment numNotified

  const created = await db.query.productNotifications.findFirst({
    where: eq(productNotifications.id, Number(notificationsTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create notification");
  }

  return created;
}

export type NotificationWithUser = ProductNotification & {
  user: User;
};

export type FindNotificationsOptions = {
  variantId: number;
  priceInCents: number;
};

export async function findPriceDropNotifications(
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

export async function findRestockNotifications(
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

  // TODO: decrement numNotified
}
