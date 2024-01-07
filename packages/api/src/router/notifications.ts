import { z } from "zod";

import { createNotification, deleteNotification, findUserNotifications } from "@awardrobe/db";

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
        variantPublicId: z.string(),
        priceInCents: z.number(),
        priceDrop: z.boolean(),
        restock: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { variantPublicId, priceInCents, priceDrop, restock } = input;

      // TODO: better error?
      if (!priceDrop && !restock) {
        throw new Error("Invalid notification type");
      }

      const notification = await createNotification({
        priceDrop,
        restock,
        variantPublicId,
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
