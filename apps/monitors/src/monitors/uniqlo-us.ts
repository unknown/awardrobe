import { render } from "@react-email/render";
import pLimit from "p-limit";

import { ProductPrice, UniqloUS } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { Prisma } from "@awardrobe/prisma-types";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";

const variantWithPrice = Prisma.validator<Prisma.ProductVariantArgs>()({
  include: { prices: { take: 1, orderBy: { timestamp: "desc" } } },
});
type VariantWithPrice = Prisma.ProductVariantGetPayload<typeof variantWithPrice>;

const productWithVariant = Prisma.validator<Prisma.ProductArgs>()({
  include: { variants: variantWithPrice },
});
type ProductWithVariant = Prisma.ProductGetPayload<typeof productWithVariant>;

type PriceFlags = {
  shouldUpdatePrice: boolean;
  hasPriceDropped: boolean;
  hasRestocked: boolean;
};

type ExtendedPrice = ProductPrice & { variant: VariantWithPrice; flags: PriceFlags };

export async function handleHeartbeat() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const products: ProductWithVariant[] = await prisma.product.findMany({
    where: { store: { handle: "uniqlo-us" } },
    include: {
      variants: {
        include: {
          prices: {
            take: 1,
            orderBy: { timestamp: "desc" },
            where: { timestamp: { gte: yesterday } },
          },
        },
      },
    },
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

async function pingProduct(product: ProductWithVariant) {
  const { prices } = await UniqloUS.getProductDetails(product.productCode, true);
  if (prices.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  const pricesWithVariants: ExtendedPrice[] = await Promise.all(
    prices.map(async (price) => {
      const existingVariant = product.variants.find(
        (variant) => variant.style === price.style && variant.size === price.size,
      );
      const variant = existingVariant ?? {
        ...(await prisma.productVariant.create({
          data: { productId: product.id, style: price.style, size: price.size },
        })),
        prices: [],
      };
      return {
        ...price,
        variant,
        flags: getFlags(price, variant, timestamp),
      };
    }),
  );

  await prisma.price.createMany({
    data: pricesWithVariants
      .filter((price) => price.flags.shouldUpdatePrice)
      .map(({ variant, priceInCents, stock }) => ({
        timestamp,
        productVariantId: variant.id,
        priceInCents,
        inStock: stock > 0,
      })),
  });

  await Promise.all([
    ...pricesWithVariants
      .filter((price) => price.flags.hasPriceDropped)
      .map((price) => handlePriceDrop(product, price)),
    ...pricesWithVariants
      .filter((price) => price.flags.hasRestocked)
      .map((price) => handleRestock(product, price)),
  ]);
}

function getFlags(newPrice: ProductPrice, variant: VariantWithPrice, timestamp: Date) {
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

async function handlePriceDrop(product: ProductWithVariant, newPrice: ExtendedPrice) {
  const { variant, style, size, priceInCents, stock } = newPrice;
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

async function handleRestock(product: ProductWithVariant, newPrice: ExtendedPrice) {
  const { variant, style, size, priceInCents } = newPrice;
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
