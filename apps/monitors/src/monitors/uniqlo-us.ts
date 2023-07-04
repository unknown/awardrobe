import { render } from "@react-email/render";
import pLimit from "p-limit";

import { ProductPrice, UniqloUS } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { Prisma } from "@awardrobe/prisma-types";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";

const extendedVariant = Prisma.validator<Prisma.ProductVariantArgs>()({
  include: { prices: { take: 1, orderBy: { timestamp: "desc" } } },
});
type ExtendedVariant = Prisma.ProductVariantGetPayload<typeof extendedVariant>;

const extendedProduct = Prisma.validator<Prisma.ProductArgs>()({
  include: { variants: extendedVariant },
});
type ExtendedProduct = Prisma.ProductGetPayload<typeof extendedProduct>;

type PriceWithVariant = ProductPrice & { variant: ExtendedVariant };

export async function handleHeartbeat() {
  const products: ExtendedProduct[] = await prisma.product.findMany({
    where: { store: { handle: "uniqlo-us" } },
    ...extendedProduct,
  });

  let successfulUpdates = 0;
  const limit = pLimit(25);
  await Promise.all(
    products.map((product) => {
      return limit(async () => {
        try {
          await pingProduct(product);
          successfulUpdates += 1;
        } catch (error) {
          console.error(`Error updating prices for ${product.name}\n${error}`);
        }
      });
    }),
  );

  console.log(`Updated prices successfully for ${successfulUpdates}/${products.length} products`);
}

async function pingProduct(product: ExtendedProduct) {
  const { prices } = await UniqloUS.getProductDetails(product.productCode, true);
  if (prices.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  const pricesWithVariants: PriceWithVariant[] = await Promise.all(
    prices.map(async (price) => {
      const existingVariant = product.variants.find(
        (variant) => variant.style === price.style && variant.size === price.size,
      );
      return {
        ...price,
        variant: existingVariant ?? {
          ...(await prisma.productVariant.create({
            data: { productId: product.id, style: price.style, size: price.size },
          })),
          prices: [],
        },
      };
    }),
  );

  await prisma.price.createMany({
    data: pricesWithVariants
      .filter((price) => getFlags(price, timestamp).shouldUpdatePrice)
      .map(({ variant, priceInCents, stock }) => ({
        timestamp,
        productVariantId: variant.id,
        priceInCents,
        inStock: stock > 0,
      })),
  });

  await Promise.all(
    pricesWithVariants
      .filter((price) => getFlags(price, timestamp).hasPriceDropped)
      .map((price) => handlePriceDrop(product, price)),
  );

  await Promise.all(
    pricesWithVariants
      .filter((price) => getFlags(price, timestamp).hasRestocked)
      .map((price) => handleRestock(product, price)),
  );
}

function getFlags({ variant, ...newPrice }: PriceWithVariant, timestamp: Date) {
  const oldPrice = variant.prices[0];
  if (!oldPrice) {
    return {
      shouldUpdatePrice: true,
      hasPriceDropped: false,
      hasRestocked: false,
    };
  }

  const diffTime = timestamp.getTime() - oldPrice.timestamp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isStale = diffDays >= 1;

  const hasPriceChanged = newPrice.priceInCents !== oldPrice.priceInCents;
  const hasPriceDropped = newPrice.priceInCents < oldPrice.priceInCents;

  const hasStockChanged = newPrice.stock > 0 !== oldPrice.inStock;
  const hasRestocked = newPrice.stock > 0 && oldPrice.inStock === false;

  return {
    shouldUpdatePrice: isStale || hasPriceChanged || hasStockChanged,
    hasPriceDropped,
    hasRestocked,
  };
}

async function handlePriceDrop(
  product: ExtendedProduct,
  { variant, style, size, priceInCents, stock }: PriceWithVariant,
) {
  console.log(`Price drop for ${product.name} - ${product.productCode} (${style} ${size})`);

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
      productVariant: { id: variant.id },
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
          style,
          size,
          priceInCents,
          productUrl: `https://getawardrobe.com/product/${product.id}`,
        }),
      );
      emailTransporter.sendMail({
        to: notification.user.email,
        subject: "Price drop",
        html: emailHtml,
      });
    }),
  );
}

async function handleRestock(
  product: ExtendedProduct,
  { variant, style, size, priceInCents }: PriceWithVariant,
) {
  console.log(`Restock for ${product.name} - ${product.productCode} (${style} ${size})`);

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
      productVariant: { id: variant.id },
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
          style,
          size,
          priceInCents: priceInCents,
          productUrl: `https://getawardrobe.com/product/${product.id}`,
        }),
      );
      emailTransporter.sendMail({
        to: notification.user.email,
        subject: "Item back in stock",
        html: emailHtml,
      });
    }),
  );
}
