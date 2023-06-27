import { ProductDetails, UniqloUS } from "@awardrobe/adapters";
import { PriceNotificationEmail, render, StockNotificationEmail } from "@awardrobe/emails";
import { Price, Product, ProductVariant, Stock } from "@awardrobe/prisma-types";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";

type ExtendedProductVariant = ProductVariant & {
  prices: Price[];
  stocks: Stock[];
};

export async function handleHeartbeat() {
  const products = await prisma.product.findMany();
  const promises = products.map((product) => pingProduct(product));
  await Promise.all(promises);
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

  const currentTime = new Date();

  await Promise.all(
    details.map(async (productDetails) => {
      const productVariant: ExtendedProductVariant = await prisma.productVariant.findUniqueOrThrow({
        where: {
          productId_style_size: {
            productId: product.id,
            style: productDetails.color,
            size: productDetails.size,
          },
        },
        include: {
          prices: { take: 1, orderBy: { timestamp: "desc" } },
          stocks: { take: 1, orderBy: { timestamp: "desc" } },
        },
      });

      await Promise.all([
        updatePrices(product, productVariant, currentTime, productDetails),
        updateStock(product, productVariant, currentTime, productDetails),
      ]);
    }),
  );
}

async function updatePrices(
  product: Product,
  productVariant: ExtendedProductVariant,
  currentTime: Date,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const oldPrice = productVariant.prices[0];

  const diffTime = oldPrice ? currentTime.getTime() - oldPrice.timestamp.getTime() : 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffPrice = oldPrice ? priceInCents - oldPrice.priceInCents : 0;

  // to avoid the prices table blowing up in size, prices are sometimes skipped from being inserted into the table
  const isStale = diffDays >= 1;
  const hasPriceChanged = diffPrice !== 0;
  if (oldPrice && !isStale && !hasPriceChanged) {
    return;
  }

  await prisma.price.create({
    data: {
      timestamp: currentTime,
      productVariant: {
        connect: { id: productVariant.id },
      },
      priceInCents,
    },
  });

  const hasPriceDropped = diffPrice < 0;
  if (hasPriceDropped) {
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

        // TODO: add product url
        const emailHtml = render(
          PriceNotificationEmail({
            productName: product.name,
            style: color,
            size,
            priceInCents: priceInCents,
            productUrl: "undefined",
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
}

async function updateStock(
  product: Product,
  productVariant: ExtendedProductVariant,
  currentTime: Date,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const oldStock = productVariant.stocks[0];

  const diffTime = oldStock ? currentTime.getTime() - oldStock.timestamp.getTime() : 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffStock = oldStock?.stock ? stock - oldStock.stock : 0;

  // to avoid the stock table blowing up in size, stocks are sometimes skipped from being inserted into the table
  const isStale = diffDays >= 1;
  const hasStockChanged = diffStock !== 0;
  if (oldStock && !isStale && !hasStockChanged) {
    return;
  }

  await prisma.stock.create({
    data: {
      timestamp: currentTime,
      productVariant: {
        connect: {
          id: productVariant.id,
        },
      },
      inStock: stock > 0,
      stock,
    },
  });

  const hasRestocked = oldStock?.stock === 0 && diffStock > 0;
  if (hasRestocked) {
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

        // TODO: add product url
        const emailHtml = render(
          StockNotificationEmail({
            productName: product.name,
            style: color,
            size,
            priceInCents: priceInCents,
            productUrl: "undefined",
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
}
