import { VariantDetails } from "@awardrobe/adapters";
import {
  createLatestPrice,
  findPriceDropNotifications,
  findRestockNotifications,
  Product,
  ProductVariantListing,
  StoreListing,
  updatePriceDropLastPing,
  updateRestockLastPing,
  updateStoreListings,
} from "@awardrobe/db";
import { PriceNotificationEmail, render, resend, StockNotificationEmail } from "@awardrobe/emails";

// TODO: config file?
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.awardrobe.co";

export async function handleDelistedListing(options: { listing: StoreListing }) {
  const { listing } = options;

  console.log(`Delisting ${listing.externalListingId}`);

  await updateStoreListings({ listingIds: [listing.id], active: false });

  // TODO: send an email?
}

export async function handleOutdatedVariant(options: {
  variantDetails: VariantDetails;
  productVariantListing: ProductVariantListing;
}) {
  const { variantDetails, productVariantListing } = options;

  await createLatestPrice({
    productVariantListingId: productVariantListing.id,
    price: variantDetails.price,
  });
}

export async function handlePriceDrop(options: {
  product: Product;
  variantDetails: VariantDetails;
  productVariantListing: ProductVariantListing;
}) {
  const { product, variantDetails, productVariantListing } = options;
  const { attributes, price } = variantDetails;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`/product/${product.publicId}`, baseUrl);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  console.log(`Price drop for ${product.name} - ${product.externalProductId} ${description}`);

  const notifications = await findPriceDropNotifications({
    variantId: productVariantListing.productVariantId,
    priceInCents: price.priceInCents,
  });

  if (notifications.length === 0) {
    return;
  }

  await updatePriceDropLastPing({
    notificationIds: notifications.map((notification) => notification.id),
  });

  const renderedEmail = await render(
    PriceNotificationEmail({
      description,
      productName: product.name,
      productUrl: url.toString(),
      priceInCents: price.priceInCents,
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
  variantDetails: VariantDetails;
  productVariantListing: ProductVariantListing;
}) {
  const { product, variantDetails, productVariantListing } = options;
  const { attributes, price } = variantDetails;

  const description = attributes.map(({ value }) => value).join(" - ");
  const url = new URL(`/product/${product.publicId}`, baseUrl);
  attributes.forEach(({ name, value }) => {
    url.searchParams.set(name, value);
  });

  console.log(`Restock for ${product.name} - ${product.externalProductId} ${description}`);

  const notifications = await findRestockNotifications({
    variantId: productVariantListing.productVariantId,
    priceInCents: price.priceInCents,
  });

  if (notifications.length === 0) {
    return;
  }

  await updateRestockLastPing({
    notificationIds: notifications.map((notification) => notification.id),
  });

  const renderedEmail = await render(
    StockNotificationEmail({
      description,
      productName: product.name,
      productUrl: url.toString(),
      priceInCents: price.priceInCents,
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
