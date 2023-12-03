import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { prisma } from "@awardrobe/prisma-types";

import { resend } from "../utils/emailer";
import { ExtendedProduct, ExtendedVariantInfo, UpdateVariantCallback, VariantFlags } from "./types";

const outdatedCallback: UpdateVariantCallback = async function updateOutdatedVariant(
  _: ExtendedProduct,
  { productVariant, timestamp, priceInCents, inStock }: ExtendedVariantInfo,
) {
  // TODO: convert this to a custom query
  await prisma.productVariant.update({
    where: { id: productVariant.id },
    data: {
      latestPrice: {
        create: {
          timestamp,
          priceInCents,
          inStock,
          productVariantId: productVariant.id,
        },
      },
    },
  });
};

const priceDropCallback: UpdateVariantCallback = async function handlePriceDrop(
  product: ExtendedProduct,
  variant: ExtendedVariantInfo,
) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      priceDrop: true,
      productVariant: { id: productVariant.id },
      AND: [
        { OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }] },
        {
          OR: [
            { lastPriceDropPing: null },
            { lastPriceDropPing: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24) } },
          ],
        },
      ],
    },
    include: { user: true },
  });

  await prisma.productNotification.updateMany({
    where: { id: { in: notifications.map(({ id }) => id) } },
    data: { lastPriceDropPing: new Date() },
  });

  await Promise.allSettled(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Price drop",
        react: PriceNotificationEmail({
          description,
          priceInCents,
          productName: product.name,
          productUrl: `https://getawardrobe.com/product/${product.id}?variantId=${productVariant.id}`,
        }),
      });
    }),
  );
};

const restockCallback: UpdateVariantCallback = async function handleRestock(
  product: ExtendedProduct,
  variant: ExtendedVariantInfo,
) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      restock: true,
      productVariant: { id: productVariant.id },
      AND: [
        { OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }] },
        {
          OR: [
            { lastRestockPing: null },
            { lastRestockPing: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24) } },
          ],
        },
      ],
    },
    include: { user: true },
  });

  await prisma.productNotification.updateMany({
    where: { id: { in: notifications.map(({ id }) => id) } },
    data: { lastRestockPing: new Date() },
  });

  await Promise.allSettled(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Item back in stock",
        react: StockNotificationEmail({
          description,
          priceInCents,
          productName: product.name,
          productUrl: `https://getawardrobe.com/product/${product.id}?variantId=${productVariant.id}`,
        }),
      });
    }),
  );
};

export const updateVariantCallbacks: Record<keyof VariantFlags, UpdateVariantCallback> = {
  isOutdated: outdatedCallback,
  hasPriceDropped: priceDropCallback,
  hasRestocked: restockCallback,
};
