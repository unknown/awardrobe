import { ProductDetails, UniqloUS } from "@awardrobe/adapters";
import { PriceNotificationEmail, render, StockNotificationEmail } from "@awardrobe/emails";
import { Prisma, Product, ProductVariant } from "@awardrobe/prisma-types";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";

const extendedProduct = Prisma.validator<Prisma.ProductArgs>()({
  include: { variants: { include: { prices: { take: 1 } } } },
});
type ExtendedProduct = Prisma.ProductGetPayload<typeof extendedProduct>;

export async function handleHeartbeat() {
  const products: ExtendedProduct[] = await prisma.product.findMany({
    where: { store: { handle: "uniqlo-us" } },
    include: { variants: { include: { prices: { take: 1, orderBy: { timestamp: "desc" } } } } },
  });
  const promises = products.map((product) => pingProduct(product));

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
}

async function pingProduct(product: ExtendedProduct) {
  const { details } = await UniqloUS.getProductDetails(product.productCode);

  if (details.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  await Promise.all(
    details.map(async (productDetails) => {
      await updatePrice(product, timestamp, productDetails);
    }),
  );
}

async function updatePrice(
  product: ExtendedProduct,
  timestamp: Date,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const existingVariant = product.variants.find(
    (variant) => variant.style === color && variant.size === size,
  );
  const variant =
    existingVariant ??
    (await prisma.productVariant.create({
      data: { productId: product.id, style: color, size },
    }));
  const oldPrice = existingVariant?.prices[0];

  const diffTime = oldPrice ? timestamp.getTime() - oldPrice.timestamp.getTime() : 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffPrice = oldPrice ? priceInCents - oldPrice.priceInCents : 0;

  // to avoid the prices table blowing up in size, prices are sometimes skipped from being inserted into the table
  const isStale = diffDays >= 1;
  const hasPriceChanged = diffPrice !== 0;
  const hasStockChanged = oldPrice ? stock > 0 !== oldPrice.inStock : false;
  if (oldPrice && !isStale && !hasPriceChanged && !hasStockChanged) {
    return;
  }

  await prisma.price.create({
    data: {
      timestamp,
      productVariant: {
        connect: { id: variant.id },
      },
      priceInCents,
      inStock: stock > 0,
    },
  });

  const hasPriceDropped = diffPrice < 0;
  if (hasPriceDropped) {
    console.log(`Price dropped for ${product.productCode} ${color} ${size}`);
    await handlePriceDrop(product, variant, { color, size, priceInCents, stock });
  }

  const hasRestocked = hasStockChanged && stock > 0;
  if (hasRestocked) {
    console.log(`Restock for ${product.productCode} ${color} ${size}`);
    await handleRestock(product, variant, { color, size, priceInCents, stock });
  }
}

async function handlePriceDrop(
  product: Product,
  productVariant: ProductVariant,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const notifications = await prisma.productNotification.findMany({
    where: {
      mustBeInStock: stock > 0 ? undefined : false,
      OR: [
        {
          priceInCents: null,
        },
        {
          priceInCents: {
            gte: priceInCents,
          },
        },
      ],
      productVariant: { id: productVariant.id },
    },
    include: {
      user: true,
    },
  });

  await Promise.all(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;

      const emailHtml = render(
        PriceNotificationEmail({
          productName: product.name,
          style: color,
          size,
          priceInCents: priceInCents,
          productUrl: `https://getawardrobe.com/product/${product.id}`,
        }),
      );

      const options = {
        to: notification.user.email,
        subject: "Price drop",
        html: emailHtml,
      };

      emailTransporter.sendMail(options);
      console.log(
        `${notification.user.email} has been notified of a price drop for ${product.name} (${color} - ${size})`,
      );
    }),
  );
}

async function handleRestock(
  product: Product,
  productVariant: ProductVariant,
  { color, size, priceInCents }: ProductDetails,
) {
  const notifications = await prisma.productNotification.findMany({
    where: {
      OR: [
        {
          priceInCents: null,
        },
        {
          priceInCents: {
            gte: priceInCents,
          },
        },
      ],
      productVariant: { id: productVariant.id },
    },
    include: {
      user: true,
    },
  });

  await Promise.all(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;

      const emailHtml = render(
        StockNotificationEmail({
          productName: product.name,
          style: color,
          size,
          priceInCents: priceInCents,
          productUrl: `https://getawardrobe.com/product/${product.id}`,
        }),
      );

      const options = {
        to: notification.user.email,
        subject: "Item back in stock",
        html: emailHtml,
      };

      emailTransporter.sendMail(options);
      console.log(
        `${notification.user.email} has been notified of a restock for ${product.name} (${color} - ${size})`,
      );
    }),
  );
}
