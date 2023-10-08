import pThrottle from "p-throttle";

import { getAdapter, VariantAttribute, VariantInfo } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { prisma, Product } from "@awardrobe/prisma-types";
import { proxies } from "@awardrobe/proxies";

import { resend } from "../utils/emailer";
import { shallowEquals } from "../utils/utils";
import { ExtendedProduct, ExtendedVariantInfo, PartialPrice } from "./types";

export async function updateProducts(
  products: ExtendedProduct[],
  priceFromVariant: Map<string, PartialPrice>,
) {
  const throttle = pThrottle({ limit: proxies.length, interval: 250 });
  const throttledUpdate = throttle(async (product: ExtendedProduct) => {
    try {
      const adapter = getAdapter(product.store.handle);
      const { variants } = await adapter.getProductDetails(product.productCode);
      if (variants.length === 0) {
        console.warn(`Product ${product.productCode} has empty data`);
        return;
      }

      const variantData: ExtendedVariantInfo[] = await Promise.all(
        variants.map(async (variantInfo) => {
          const variant = await getProductVariant(product, variantInfo);
          const oldPrice = priceFromVariant.get(variant.id) ?? null;
          return {
            ...variantInfo,
            productVariant: variant,
            flags: getFlags(variantInfo, oldPrice),
          };
        }),
      );

      await updateOutdatedPrices(
        variantData.filter((variantInfo) => variantInfo.flags.isOutdated),
        priceFromVariant,
      );

      await Promise.all(
        variantData.map(async (variantInfo) => {
          if (variantInfo.flags.hasPriceDropped) {
            await handlePriceDrop(product, variantInfo);
          }
          if (variantInfo.flags.hasRestocked) {
            await handleRestock(product, variantInfo);
          }
        }),
      );
    } catch (error) {
      console.error(`Error updating ${product.name}\n${error}`);
    }
  });

  await Promise.all(products.map(throttledUpdate));
}

async function getProductVariant(product: ExtendedProduct, variantInfo: VariantInfo) {
  const { productUrl, attributes } = variantInfo;
  const inputAttributeMap = attributesToMap(attributes);
  const existingVariant = product.variants.find((productVariant) => {
    const variantAttributes = productVariant.attributes as VariantAttribute[];
    const variantAttributeMap = attributesToMap(variantAttributes);
    return shallowEquals(inputAttributeMap, variantAttributeMap);
  });

  if (!existingVariant) {
    console.warn(`Creating new variant: ${JSON.stringify(attributes)}`);
    const productVariant = await prisma.productVariant.create({
      data: {
        attributes,
        productUrl,
        productId: product.id,
      },
      include: { prices: true },
    });
    product.variants.push(productVariant);
    return productVariant;
  }
  return existingVariant;
}

function attributesToMap(attributes: VariantAttribute[]) {
  return attributes.reduce(
    (acc, attribute) => {
      acc[attribute.name] = attribute.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

function getFlags(variantInfo: VariantInfo, oldPrice: PartialPrice | null) {
  if (!oldPrice) {
    return {
      isOutdated: true,
      hasPriceDropped: false,
      hasRestocked: false,
    };
  }

  const diffTime = variantInfo.timestamp.getTime() - oldPrice.timestamp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isStale = diffDays >= 1;

  const hasPriceChanged = variantInfo.priceInCents !== oldPrice.priceInCents;
  const hasPriceDropped = variantInfo.priceInCents < oldPrice.priceInCents;

  const hasStockChanged = variantInfo.inStock !== oldPrice.inStock;
  const hasRestocked = variantInfo.inStock && !oldPrice.inStock;

  return {
    hasPriceDropped,
    hasRestocked,
    isOutdated: isStale || hasPriceChanged || hasStockChanged,
  };
}

async function updateOutdatedPrices(
  outdatedVariants: ExtendedVariantInfo[],
  priceFromVariant: Map<string, PartialPrice>,
) {
  await prisma.price.createMany({
    data: outdatedVariants.map(({ productVariant, timestamp, priceInCents, inStock }) => ({
      productVariantId: productVariant.id,
      timestamp,
      priceInCents,
      inStock,
    })),
  });

  outdatedVariants.forEach(({ productVariant, timestamp, priceInCents, inStock }) => {
    priceFromVariant.set(productVariant.id, { timestamp, priceInCents, inStock });
  });
}

async function handlePriceDrop(product: Product, variant: ExtendedVariantInfo) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      priceDrop: true,
      productVariant: { id: productVariant.id },
      AND: [
        { OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }] },
        {
          OR: [
            { lastPriceDropPing: null },
            { lastPriceDropPing: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24) } },
          ],
        },
      ],
    },
    include: { user: true },
  });

  await prisma.productNotification.updateMany({
    where: { id: { in: notifications.map(({ id }) => id) } },
    data: { lastPriceDropPing: new Date() },
  });

  await Promise.all(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Price drop",
        react: PriceNotificationEmail({
          productName: product.name,
          description,
          priceInCents,
          productUrl: `https://getawardrobe.com/product/${product.id}?variantId=${productVariant.id}`,
        }),
      });
    }),
  );
}

async function handleRestock(product: Product, variant: ExtendedVariantInfo) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const notifications = await prisma.productNotification.findMany({
    where: {
      restock: true,
      productVariant: { id: productVariant.id },
      AND: [
        { OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }] },
        {
          OR: [
            { lastRestockPing: null },
            { lastRestockPing: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24) } },
          ],
        },
      ],
    },
    include: { user: true },
  });

  await prisma.productNotification.updateMany({
    where: { id: { in: notifications.map(({ id }) => id) } },
    data: { lastRestockPing: new Date() },
  });

  await Promise.all(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      await resend.emails.send({
        to: [notification.user.email],
        from: "Awardrobe <notifications@getawardrobe.com>",
        subject: "Item back in stock",
        react: StockNotificationEmail({
          productName: product.name,
          description,
          priceInCents,
          productUrl: `https://getawardrobe.com/product/${product.id}?variantId=${productVariant.id}`,
        }),
      });
    }),
  );
}
