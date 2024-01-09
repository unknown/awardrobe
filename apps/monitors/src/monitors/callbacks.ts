import { VariantInfo } from "@awardrobe/adapters";
import {
  createLatestPrice,
  findPriceDropNotifications,
  findRestockNotifications,
  Product,
  ProductVariant,
  updatePriceDropLastPing,
  updateProductsDelisted,
  updateRestockLastPing,
} from "@awardrobe/db";
import { PriceNotificationEmail, render, resend, StockNotificationEmail } from "@awardrobe/emails";

// TODO: config file?
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.awardrobe.co";

export async function handleDelistedProduct(options: { product: Product }) {
  const { product } = options;

  await updateProductsDelisted({ productIds: [product.id], delisted: true });
}

export async function handleOutdatedVariant(options: {
  variantInfo: VariantInfo;
  productVariant: ProductVariant;
}) {
  const { variantInfo, productVariant } = options;

  await createLatestPrice({
    variantInfo,
    variantId: productVariant.id,
  });
}

export async function handlePriceDrop(options: {
  product: Product;
  variantInfo: VariantInfo;
  productVariant: ProductVariant;
}) {
  const { product, variantInfo, productVariant } = options;
  const { attributes, priceInCents } = variantInfo;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`/product/${product.publicId}`, baseUrl);
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

  const renderedEmail = await render(
    PriceNotificationEmail({
      description,
      priceInCents,
      productName: product.name,
      productUrl: url.toString(),
    }),
  );

  await Promise.allSettled(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Price drop",
        html: renderedEmail,
      });
    }),
  );
}

export async function handleRestock(options: {
  product: Product;
  variantInfo: VariantInfo;
  productVariant: ProductVariant;
}) {
  const { product, variantInfo, productVariant } = options;
  const { attributes, priceInCents } = variantInfo;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`/product/${product.publicId}`, baseUrl);
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

  const renderedEmail = await render(
    StockNotificationEmail({
      description,
      priceInCents,
      productName: product.name,
      productUrl: url.toString(),
    }),
  );

  await Promise.allSettled(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Item back in stock",
        html: renderedEmail,
      });
    }),
  );
}
