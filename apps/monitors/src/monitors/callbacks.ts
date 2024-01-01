import {
  createLatestPrice,
  findPriceDropNotifications,
  findRestockNotifications,
  updatePriceDropLastPing,
  updateRestockLastPing,
} from "@awardrobe/db";
import { PriceNotificationEmail, resend, StockNotificationEmail } from "@awardrobe/emails";

import { UpdateVariantCallback, VariantFlags } from "./types";

// TODO: config file?
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.awardrobe.co";

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
  const url = new URL(`/product/${product.id}`, baseUrl);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await findPriceDropNotifications({
    priceInCents,
    variantId: productVariant.id,
  });

  await updatePriceDropLastPing({
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
  const url = new URL(`/product/${product.id}`, baseUrl);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await findRestockNotifications({
    priceInCents,
    variantId: productVariant.id,
  });

  await updateRestockLastPing({
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
