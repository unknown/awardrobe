import { z } from "zod";

import { VariantAttribute } from "@awardrobe/adapters";
import {
  createNotification,
  deleteNotification,
  findProductVariantFromCollection,
  findUserNotifications,
} from "@awardrobe/db";

import { protectedProcedure, router } from "../trpc";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        productPublicId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { productPublicId } = input;

      const notifications = await findUserNotifications({
        productPublicId,
        userId: ctx.session.user.id,
      });

      return notifications;
    }),
  create: protectedProcedure
    .input(
      z.object({
        collectionPublicId: z.string(),
        attributes: z.record(z.string()),
        priceInCents: z.number(),
        priceDrop: z.boolean(),
        restock: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { collectionPublicId, attributes, priceInCents, priceDrop, restock } = input;

      if (!priceDrop && !restock) {
        throw new Error("Invalid notification type");
      }

      const variantAttributes: VariantAttribute[] = Object.entries(attributes).map(
        ([name, value]) => ({ name, value }),
      );

      const productVariant = await findProductVariantFromCollection({
        collectionPublicId,
        attributes: variantAttributes,
      });

      if (!productVariant) {
        throw new Error("Product variant does not exist");
      }

      const notification = await createNotification({
        priceDrop,
        restock,
        productId: productVariant.productId,
        productVariantId: productVariant.id,
        userId: ctx.session.user.id,
        priceInCents: priceInCents,
      });

      return notification;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        notificationPublicId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { notificationPublicId } = input;

      await deleteNotification({
        notificationPublicId,
        userId: ctx.session.user.id,
      });
    }),
});
