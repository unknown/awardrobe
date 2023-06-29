import { ProductDetails, UniqloUS } from "@awardrobe/adapters";
import { PriceNotificationEmail, render, StockNotificationEmail } from "@awardrobe/emails";
import { Price, Product, ProductVariant } from "@awardrobe/prisma-types";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";

export async function handleHeartbeat() {
  const products = await prisma.product.findMany();
  const promises = products.map((product) => pingProduct(product));

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
}

async function pingProduct(product: Product) {
  // TODO: handle errors better
  const { details } = await UniqloUS.getProductDetails(product.productCode).catch((error) => {
    console.error(`Error fetching product ${product.productCode}: ${error.message}`);
    return { details: [] };
  });

  if (details.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const pricesTimestamp = new Date();

  const productVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    include: { prices: { take: 1, orderBy: { timestamp: "desc" } } },
  });

  await Promise.all(
    details.map(async (productDetails) => {
      const existingVariant = productVariants.find(
        (variant) => variant.style === productDetails.color && variant.size === productDetails.size,
      );

      const variant =
        existingVariant ??
        (await prisma.productVariant.create({
          data: { productId: product.id, style: productDetails.color, size: productDetails.size },
        }));

      await updatePrice(
        product,
        variant,
        existingVariant?.prices[0],
        pricesTimestamp,
        productDetails,
      );
    }),
  );

  console.log(
    `Updated prices for ${product.productCode} in ${Date.now() - pricesTimestamp.getTime()}ms`,
  );
}

async function updatePrice(
  product: Product,
  productVariant: ProductVariant,
  oldPrice: Price | undefined,
  currentTime: Date,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const diffTime = oldPrice ? currentTime.getTime() - oldPrice.timestamp.getTime() : 0;
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
      timestamp: currentTime,
      productVariant: {
        connect: { id: productVariant.id },
      },
      priceInCents,
      inStock: stock > 0,
    },
  });

  const hasPriceDropped = diffPrice < 0;
  if (hasPriceDropped) {
    console.log(`Price dropped for ${product.productCode} ${color} ${size}`);
    await handlePriceDrop(product, productVariant, { color, size, priceInCents, stock });
  }

  const hasRestocked = hasStockChanged && stock > 0;
  if (hasRestocked) {
    console.log(`Restock for ${product.productCode} ${color} ${size}`);
    await handleRestock(product, productVariant, { color, size, priceInCents, stock });
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
