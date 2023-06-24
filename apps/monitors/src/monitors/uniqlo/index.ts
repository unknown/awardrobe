import { renderStockNotification } from "@awardrobe/emails";
import { Product } from "@awardrobe/prisma-types";

import { dollarsToCents } from "../../utils/currency";
import prisma from "../../utils/database";
import emailTransporter from "../../utils/emailer";
import { toTitleCase } from "../../utils/formatter";
import { ProductDetails, UniqloType } from "./types";

export async function handleHeartbeat() {
  const products = await prisma.product.findMany();
  const promises = products.map((product) => pingProduct(product));
  await Promise.all(promises);
}

async function pingProduct(product: Product) {
  const details = await getProductDetails(product.productCode);
  if (details.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const currentTime = new Date();

  await Promise.all(
    details.map(async (price) => {
      await Promise.all([
        updatePrices(product, currentTime, price),
        updateStock(product, currentTime, price),
      ]);
    }),
  );
}

async function updatePrices(
  product: Product,
  currentTime: Date,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const oldPrice = await prisma.price.findFirst({
    where: {
      productVariant: {
        productId: product.id,
        style: color,
        size,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

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
        connect: {
          productId_style_size: {
            productId: product.id,
            style: color,
            size,
          },
        },
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
        productVariant: {
          style: color,
          size,
        },
      },
    });

    await Promise.all(
      notifications.map(async (notification) => {
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: notification.userId },
        });

        console.log(user.email);
      }),
    );
  }
}

async function updateStock(
  product: Product,
  currentTime: Date,
  { color, size, priceInCents, stock }: ProductDetails,
) {
  const oldStock = await prisma.stock.findFirst({
    where: {
      productVariant: {
        productId: product.id,
        style: color,
        size,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

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
          productId_style_size: {
            productId: product.id,
            style: color,
            size,
          },
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
        productVariant: {
          style: color,
          size,
        },
      },
    });

    await Promise.all(
      notifications.map(async (notification) => {
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: notification.userId },
        });

        if (!user.email) return;

        const emailHtml = renderStockNotification({
          productName: product.name,
          priceInCents: priceInCents,
          productUrl: "undefined",
        });

        const options = {
          to: user.email,
          subject: "Item Restock",
          html: emailHtml,
        };

        emailTransporter.sendMail(options);
      }),
    );
  }
}

async function getProductDetails(productCode: string) {
  const pricesEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;

  const [pricesData, detailsData] = await Promise.all([
    (await fetch(pricesEndpoint)).json(),
    (await fetch(detailsEndpoint)).json(),
  ]);

  // TODO: type these result objects with zod?
  const { stocks, prices: pricesObject, l2s } = pricesData.result;
  const { colors, sizes }: { colors: UniqloType[]; sizes: UniqloType[] } = detailsData.result;

  // used to map display codes to human-readable names (e.g. "08" -> "08 Dark Gray")
  const colorsRecord = colors.reduce((colors, color) => {
    colors[color.displayCode] = toTitleCase(`${color.displayCode} ${color.name}`);
    return colors;
  }, {} as Record<string, string>);
  const sizesRecord = sizes.reduce((sizes, size) => {
    sizes[size.displayCode] = size.name;
    return sizes;
  }, {} as Record<string, string>);

  const details: ProductDetails[] = Object.keys(stocks).map((key, index) => {
    const colorDisplayCode: string = l2s[index].color.displayCode.toString();
    const sizeDisplayCode: string = l2s[index].size.displayCode.toString();
    const price: string = pricesObject[key].base.value.toString();
    const stock = parseInt(stocks[key].quantity);

    return {
      color: colorsRecord[colorDisplayCode],
      size: sizesRecord[sizeDisplayCode],
      priceInCents: dollarsToCents(price),
      stock,
    };
  });

  return details;
}
