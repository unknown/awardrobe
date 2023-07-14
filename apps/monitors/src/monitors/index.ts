import { render } from "@react-email/render";
import pLimit from "p-limit";

import { getAdapter, ProductPrice, VariantAttribute } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";
import { shallowEquals } from "../utils/utils";
import { ExtendedPrice, ExtendedProduct, VariantWithPrice } from "./types";

export async function pingProducts() {
  console.log(`Pinging products`);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const products: ExtendedProduct[] = await prisma.product.findMany({
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
      store: true,
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

async function pingProduct(product: ExtendedProduct) {
  const adapter = getAdapter(product.store.handle);
  const { prices } = await adapter.getProductDetails(product.productCode, true);
  if (prices.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  const pricesWithVariants: ExtendedPrice[] = await Promise.all(
    prices.map(async (price) => {
      let variant = product.variants.find((variant) => {
        const attributes = variant.attributes as VariantAttribute[];
        if (attributes.length !== price.attributes.length) return false;
        return attributes.every((attribute) => {
          return price.attributes.some((priceAttribute) => {
            return shallowEquals(attribute, priceAttribute);
          });
        });
      });
      if (!variant) {
        console.warn(`Creating new variant: ${JSON.stringify(price.attributes)}`);
        variant = {
          ...(await prisma.productVariant.create({
            data: {
              productId: product.id,
              attributes: price.attributes,
              productUrl: price.productUrl,
            },
          })),
          prices: [],
        };
      }
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
      .map(({ variant, priceInCents, inStock }) => ({
        timestamp,
        productVariantId: variant.id,
        priceInCents,
        inStock,
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

  const hasStockChanged = newPrice.inStock !== oldPrice.inStock;
  const hasRestocked = newPrice.inStock && !oldPrice.inStock;

  return {
    shouldUpdatePrice: isStale || hasPriceChanged || hasStockChanged,
    hasPriceDropped,
    hasRestocked,
  };
}

async function handlePriceDrop(product: ExtendedProduct, newPrice: ExtendedPrice) {
  const { variant, attributes, priceInCents, inStock } = newPrice;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      mustBeInStock: inStock ? undefined : false,
      OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }],
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
          description,
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

async function handleRestock(product: ExtendedProduct, newPrice: ExtendedPrice) {
  const { variant, attributes, priceInCents } = newPrice;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }],
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
          description,
          priceInCents,
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
