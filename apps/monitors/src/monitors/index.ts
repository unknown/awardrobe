import { render } from "@react-email/render";
import pLimit from "p-limit";

import { getAdapter, VariantAttribute, VariantInfo } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { prisma, Product } from "@awardrobe/prisma-types";

import emailTransporter from "../utils/emailer";
import { shallowEquals } from "../utils/utils";
import { ExtendedProduct, PartialPrice, VariantInfoWithVariant } from "./types";

export async function updateProducts(
  products: ExtendedProduct[],
  priceFromVariant: Map<string, PartialPrice>,
) {
  const limit = pLimit(25);
  await Promise.all(
    products.map((product) => {
      return limit(async () => {
        try {
          const variants = await getProductVariantInfo(product);
          const outdatedVariants: VariantInfoWithVariant[] = [];
          const priceDroppedVariants: VariantInfoWithVariant[] = [];
          const restockedVariants: VariantInfoWithVariant[] = [];

          await Promise.all(
            variants.map(async (variantInfo) => {
              const variant = await getVariant(product, variantInfo);
              const variantInfoWithVariant: VariantInfoWithVariant = {
                ...variantInfo,
                productVariant: variant,
              };

              const oldPrice = priceFromVariant.get(variant.id) ?? null;
              const flags = getFlags(variantInfoWithVariant, oldPrice);

              if (flags.isOutdated) outdatedVariants.push(variantInfoWithVariant);
              if (flags.hasPriceDropped) priceDroppedVariants.push(variantInfoWithVariant);
              if (flags.hasRestocked) restockedVariants.push(variantInfoWithVariant);
            }),
          );

          await updateOutdatedPrices(outdatedVariants, priceFromVariant);

          await Promise.all([
            ...priceDroppedVariants.map((variant) => handlePriceDrop(product, variant)),
            ...restockedVariants.map((variant) => handleRestock(product, variant)),
          ]);
        } catch (error) {
          console.error(`Error updating ${product.name}\n${error}`);
        }
      });
    }),
  );
}

async function getProductVariantInfo(product: ExtendedProduct) {
  const adapter = getAdapter(product.store.handle);
  const { variants } = await adapter.getProductDetails(product.productCode, true);
  if (variants.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }
  return variants;
}

async function getVariant(product: ExtendedProduct, variant: VariantInfo) {
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
    console.error(`Creating new variant: ${JSON.stringify(variant.attributes)}`);
    productVariant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        attributes: variant.attributes,
        productUrl: variant.productUrl,
      },
      include: { prices: true },
    });
  }
  return productVariant;
}

function getFlags(variantInfo: VariantInfoWithVariant, oldPrice: PartialPrice | null) {
  if (!oldPrice) {
    console.log(`No old price for ${variantInfo.productVariant.id}`);
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
    isOutdated: isStale || hasPriceChanged || hasStockChanged,
    hasPriceDropped,
    hasRestocked,
  };
}

async function updateOutdatedPrices(
  outdatedVariants: VariantInfoWithVariant[],
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
    console.log(`Updated price for ${productVariant.id} to ${priceInCents}`);
  });
}

async function handlePriceDrop(product: Product, variant: VariantInfoWithVariant) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Price drop for ${product.name} - ${product.productCode} ${description}`);

  const emailHtml = render(
    PriceNotificationEmail({
      productName: product.name,
      description,
      priceInCents,
      productUrl: `https://getawardrobe.com/product/${product.id}?variantId=${productVariant.id}`,
    }),
  );

  const notifications = await prisma.productNotification.findMany({
    where: {
      priceDrop: true,
      OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }],
      productVariant: { id: productVariant.id },
    },
    include: { user: true },
  });

  await Promise.all(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      emailTransporter.sendMail({
        to: notification.user.email,
        subject: "Price drop",
        html: emailHtml,
      });
    }),
  );
}

async function handleRestock(product: Product, variant: VariantInfoWithVariant) {
  const { productVariant, attributes, priceInCents } = variant;
  const description = attributes.map(({ value }) => value).join(" - ");

  console.log(`Restock for ${product.name} - ${product.productCode} ${description}`);

  const emailHtml = render(
    StockNotificationEmail({
      productName: product.name,
      description,
      priceInCents,
      productUrl: `https://getawardrobe.com/product/${product.id}?variantId=${productVariant.id}`,
    }),
  );

  const notifications = await prisma.productNotification.findMany({
    where: {
      restock: true,
      OR: [{ priceInCents: null }, { priceInCents: { gte: priceInCents } }],
      productVariant: { id: productVariant.id },
    },
    include: { user: true },
  });

  await Promise.all(
    notifications.map(async (notification) => {
      if (!notification.user.email) return;
      emailTransporter.sendMail({
        to: notification.user.email,
        subject: "Item back in stock",
        html: emailHtml,
      });
    }),
  );
}
