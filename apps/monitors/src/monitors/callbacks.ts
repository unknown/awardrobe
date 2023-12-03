import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import {
  createLatestPrice,
  findNotificationsByType,
  updateLastPingByType,
} from "@awardrobe/prisma-types";

import { resend } from "../utils/emailer";
import { ExtendedProduct, ExtendedVariantInfo, UpdateVariantCallback, VariantFlags } from "./types";

const outdatedCallback: UpdateVariantCallback = async function updateOutdatedVariant(
  _: ExtendedProduct,
  variantInfo: ExtendedVariantInfo,
) {
  await createLatestPrice({
    variantInfo,
    variantId: variantInfo.productVariant.id,
  });
};

const priceDropCallback: UpdateVariantCallback = async function handlePriceDrop(
  product: ExtendedProduct,
  variantInfo: ExtendedVariantInfo,
) {
  const { productVariant, attributes, priceInCents } = variantInfo;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await findNotificationsByType({
    type: "priceDrop",
    priceInCents,
    variantId: productVariant.id,
  });

  await updateLastPingByType({
    type: "priceDrop",
    notificationIds: notifications.map(({ id }) => id),
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
  variantInfo: ExtendedVariantInfo,
) {
  const { productVariant, attributes, priceInCents } = variantInfo;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await findNotificationsByType({
    type: "restock",
    priceInCents,
    variantId: productVariant.id,
  });

  await updateLastPingByType({
    type: "restock",
    notificationIds: notifications.map(({ id }) => id),
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
