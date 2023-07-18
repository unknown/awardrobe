import { render } from "@react-email/render";
import pLimit from "p-limit";

import { getAdapter, VariantAttribute } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { prisma } from "@awardrobe/prisma-types";

import emailTransporter from "../utils/emailer";
import { shallowEquals } from "../utils/utils";
import { ExtendedProduct, ExtendedVariantInfo } from "./types";

export async function pingProducts() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
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

  console.log(`Pinging ${products.length} products`);

  const limit = pLimit(25);
  await Promise.all(
    products.map((product) => {
      return limit(async () => {
        try {
          await pingProduct(product);
        } catch (error) {
          console.error(`Error updating ${product.name}\n${error}`);
        }
      });
    }),
  );

  console.log("Done pinging products");
}

async function pingProduct(product: ExtendedProduct) {
  const adapter = getAdapter(product.store.handle);
  const { variants } = await adapter.getProductDetails(product.productCode, true);
  if (variants.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  const outOfDatePrices: ExtendedVariantInfo[] = [];
  const priceDroppedVariants: ExtendedVariantInfo[] = [];
  const restockedVariants: ExtendedVariantInfo[] = [];
  await Promise.all(
    variants.map(async (variant) => {
      let productVariant = product.variants.find((productVariant) => {
        const attributes = productVariant.attributes as VariantAttribute[];
        if (attributes.length !== variant.attributes.length) return false;
        // TODO: use a map?
        return attributes.every((attribute) => {
          return variant.attributes.some((priceAttribute) => {
            return shallowEquals(attribute, priceAttribute);
          });
        });
      });
      if (!productVariant) {
        console.warn(`Creating new variant: ${JSON.stringify(variant.attributes)}`);
        productVariant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            attributes: variant.attributes,
            productUrl: variant.productUrl,
          },
          include: { prices: true },
        });
      }

      const extendedVariant: ExtendedVariantInfo = { ...variant, productVariant };
      const { isOutOfDate, hasPriceDropped, hasRestocked } = getFlags(extendedVariant, timestamp);

      if (isOutOfDate) outOfDatePrices.push(extendedVariant);
      if (hasPriceDropped) priceDroppedVariants.push(extendedVariant);
      if (hasRestocked) restockedVariants.push(extendedVariant);
    }),
  );

  await prisma.price.createMany({
    data: outOfDatePrices.map(({ productVariant: variant, priceInCents, inStock }) => ({
      timestamp,
      productVariantId: variant.id,
      priceInCents,
      inStock,
    })),
  });

  await Promise.all([
    ...priceDroppedVariants.map((variant) => handlePriceDrop(product, variant)),
    ...restockedVariants.map((variant) => handleRestock(product, variant)),
  ]);
}

function getFlags(variant: ExtendedVariantInfo, timestamp: Date) {
  const oldPrice = variant.productVariant.prices[0];
  if (!oldPrice) {
    return {
      isOutOfDate: true,
      hasPriceDropped: false,
      hasRestocked: false,
    };
  }

  const diffTime = timestamp.getTime() - oldPrice.timestamp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isStale = diffDays >= 1;

  const hasPriceChanged = variant.priceInCents !== oldPrice.priceInCents;
  const hasPriceDropped = variant.priceInCents < oldPrice.priceInCents;

  const hasStockChanged = variant.inStock !== oldPrice.inStock;
  const hasRestocked = variant.inStock && !oldPrice.inStock;

  return {
    isOutOfDate: isStale || hasPriceChanged || hasStockChanged,
    hasPriceDropped,
    hasRestocked,
  };
}

async function handlePriceDrop(product: ExtendedProduct, variant: ExtendedVariantInfo) {
  const { productVariant, attributes, priceInCents, inStock } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      mustBeInStock: inStock ? undefined : false,
      OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }],
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

async function handleRestock(product: ExtendedProduct, variant: ExtendedVariantInfo) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }],
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
