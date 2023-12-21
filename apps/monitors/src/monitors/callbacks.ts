import { createLatestPrice, findNotificationsByType, updateLastPingByType } from "@awardrobe/db";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";

import { resend } from "../utils/emailer";
import { UpdateVariantCallback, VariantFlags } from "./types";

const outdatedCallback: UpdateVariantCallback = async function updateOutdatedVariant({
  variantInfo,
  productVariant,
}) {
  await createLatestPrice({
    variantInfo,
    variantId: productVariant.id,
  });
};

const priceDropCallback: UpdateVariantCallback = async function handlePriceDrop({
  product,
  variantInfo,
  productVariant,
}) {
  const { attributes, priceInCents } = variantInfo;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`https://www.awardrobe.co/product/${product.id}`);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await findNotificationsByType({
    type: "priceDrop",
    priceInCents,
    variantId: productVariant.id,
  });

  await updateLastPingByType({
    type: "priceDrop",
    notificationIds: notifications.map((notification) => notification.id),
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
          productUrl: url.toString(),
        }),
      });
    }),
  );
};

const restockCallback: UpdateVariantCallback = async function handleRestock({
  product,
  variantInfo,
  productVariant,
}) {
  const { attributes, priceInCents } = variantInfo;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`https://www.awardrobe.co/product/${product.id}`);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await findNotificationsByType({
    type: "restock",
    priceInCents,
    variantId: productVariant.id,
  });

  await updateLastPingByType({
    type: "restock",
    notificationIds: notifications.map((notification) => notification.id),
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
          productUrl: url.toString(),
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
