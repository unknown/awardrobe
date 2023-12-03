import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

export async function createNotification(options: {
  variantId: string;
  userId: string;
  priceInCents: number | null;
  priceDrop: boolean;
  restock: boolean;
}) {
  const { variantId, userId, priceInCents, priceDrop, restock } = options;

  return await prisma.productNotification.create({
    data: {
      productVariant: { connect: { id: variantId } },
      priceInCents,
      priceDrop,
      restock,
      user: { connect: { id: userId } },
    },
    include: { productVariant: true },
  });
}

const notificationWithVariant = Prisma.validator<Prisma.ProductNotificationDefaultArgs>()({
  include: { productVariant: true },
});

export type NotificationWithVariant = Prisma.ProductNotificationGetPayload<
  typeof notificationWithVariant
>;

export async function findNotificationsByUser(options: {
  userId: string;
  productIds?: string[];
}): Promise<NotificationWithVariant[]> {
  const { userId, productIds } = options;

  return await prisma.productNotification.findMany({
    where: {
      userId,
      productVariant: productIds ? { productId: { in: productIds } } : undefined,
    },
    include: { productVariant: true },
  });
}

type NotificationType = "priceDrop" | "restock";

export async function findNotificationsByType(options: {
  type: NotificationType;
  variantId: string;
  priceInCents: number;
}) {
  const { type, variantId, priceInCents } = options;
  const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);

  const whereInputFromType: Record<NotificationType, Prisma.ProductNotificationWhereInput> = {
    priceDrop: {
      priceDrop: true,
      AND: [
        { OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }] },
        { OR: [{ lastPriceDropPing: null }, { lastPriceDropPing: { lt: yesterday } }] },
      ],
    },
    restock: {
      restock: true,
      AND: [
        { OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }] },
        { OR: [{ lastRestockPing: null }, { lastRestockPing: { lt: yesterday } }] },
      ],
    },
  };

  return await prisma.productNotification.findMany({
    include: { user: true },
    where: {
      productVariant: { id: variantId },
      ...whereInputFromType[type],
    },
  });
}

export async function updateLastPingByType(options: {
  type: NotificationType;
  notificationIds: string[];
}) {
  const { type, notificationIds } = options;
  const date = new Date();

  const mutationInputFromType: Record<
    NotificationType,
    Prisma.ProductNotificationUpdateManyMutationInput
  > = {
    priceDrop: { lastPriceDropPing: date },
    restock: { lastRestockPing: date },
  };

  return await prisma.productNotification.updateMany({
    where: { id: { in: notificationIds } },
    data: mutationInputFromType[type],
  });
}

export async function deleteNotification(options: { notificationId: string }) {
  const { notificationId } = options;

  return await prisma.productNotification.delete({
    where: { id: notificationId },
  });
}
