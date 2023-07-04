import { render } from "@react-email/render";
import pLimit from "p-limit";

import { ProductPrice, UniqloUS } from "@awardrobe/adapters";
import { PriceNotificationEmail, StockNotificationEmail } from "@awardrobe/emails";
import { Prisma, Product, ProductVariant } from "@awardrobe/prisma-types";

import prisma from "../utils/database";
import emailTransporter from "../utils/emailer";

const extendedVariant = Prisma.validator<Prisma.ProductVariantArgs>()({
  include: { prices: { take: 1 } },
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
    include: { variants: { include: { prices: { take: 1, orderBy: { timestamp: "desc" } } } } },
  });

  const limit = pLimit(25);

  await Promise.all(
    products.map((product) => {
      return limit(async () => {
        try {
          await pingProduct(product);
          console.log(`Updated prices for ${product.name}`);
        } catch (error) {
          console.error(`Error updating prices for ${product.name}\n${error}`);
        }
      });
    }),
  );

  console.log(`Updated prices for ${products.length} products`);
}

async function pingProduct(product: ExtendedProduct) {
  const { prices } = await UniqloUS.getProductDetails(product.productCode, true);
  if (prices.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  const pricesWithVariants: PriceWithVariant[] = (
    await Promise.all(
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
    )
  ).filter((price) => shouldUpdatePrice(price, timestamp));

  await prisma.price.createMany({
    data: pricesWithVariants.map(({ variant, priceInCents, stock }) => ({
      timestamp,
      productVariantId: variant.id,
      priceInCents,
      inStock: stock > 0,
    })),
  });

  await Promise.all(
    pricesWithVariants.map(async (price) => {
      await handleNotifications(product, price);
    }),
  );
}

function shouldUpdatePrice({ priceInCents, stock, variant }: PriceWithVariant, timestamp: Date) {
  const oldPrice = variant.prices[0];
  if (!oldPrice) {
    return true;
  }

  const diffTime = timestamp.getTime() - oldPrice.timestamp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffPrice = priceInCents - oldPrice.priceInCents;

  const isStale = diffDays >= 1;
  const hasPriceChanged = diffPrice !== 0;
  const hasStockChanged = oldPrice ? stock > 0 !== oldPrice.inStock : false;

  return isStale || hasPriceChanged || hasStockChanged;
}

async function handleNotifications(product: ExtendedProduct, price: PriceWithVariant) {
  const { style, size, priceInCents, stock, variant } = price;
  const oldPrice = variant.prices[0];

  const diffPrice = oldPrice ? priceInCents - oldPrice.priceInCents : 0;
  const hasPriceDropped = diffPrice < 0;
  if (hasPriceDropped) {
    console.log(`Price dropped for ${product.productCode} ${style} ${size}`);
    await handlePriceDrop(product, variant, price);
  }

  const hasStockChanged = oldPrice ? stock > 0 !== oldPrice.inStock : false;
  const hasRestocked = hasStockChanged && stock > 0;
  if (hasRestocked) {
    console.log(`Restock for ${product.productCode} ${style} ${size}`);
    await handleRestock(product, variant, price);
  }
}

async function handlePriceDrop(
  product: Product,
  productVariant: ProductVariant,
  { style, size, priceInCents, stock }: ProductPrice,
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
          style,
          size,
          priceInCents,
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
        `${notification.user.email} has been notified of a price drop for ${product.name} (${style} - ${size})`,
      );
    }),
  );
}

async function handleRestock(
  product: Product,
  productVariant: ProductVariant,
  { style, size, priceInCents }: ProductPrice,
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
          style,
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
        `${notification.user.email} has been notified of a restock for ${product.name} (${style} - ${size})`,
      );
    }),
  );
}
