import { Product } from "database";

import { dollarsToCents } from "../../utils/currency";
import prisma from "../../utils/database";
import { toTitleCase } from "../../utils/formatter";
import { Price, UniqloType } from "./types";

export async function handleHeartbeat() {
  const products = await prisma.product.findMany();
  const promises = products.map((product) => {
    pingProduct(product);
  });
  await Promise.all(promises);
}

async function pingProduct(product: Product) {
  const prices = await getProductPrices(product.productCode);
  if (prices.length === 0) {
    console.warn(`Product ${product.productCode} has empty data`);
  }

  const timestamp = new Date();

  await Promise.all(
    prices.map(async ({ color, size, priceInCents, stock }) => {
      const createPricePromise = prisma.price.create({
        data: {
          timestamp,
          product: {
            connect: { id: product.id },
          },
          priceInCents,
          stock,
          inStock: stock > 0,
          variants: {
            connectOrCreate: [
              {
                where: {
                  productId_optionType_value: {
                    productId: product.id,
                    optionType: "Color",
                    value: color,
                  },
                },
                create: {
                  productId: product.id,
                  optionType: "Color",
                  value: color,
                },
              },
              {
                where: {
                  productId_optionType_value: {
                    productId: product.id,
                    optionType: "Size",
                    value: size,
                  },
                },
                create: {
                  productId: product.id,
                  optionType: "Size",
                  value: size,
                },
              },
            ],
          },
        },
      });

      const oldPrice = await prisma.price.findFirst({
        where: {
          productId: product.id,
          AND: [
            {
              variants: {
                some: {
                  productId: product.id,
                  optionType: "Color",
                  value: color,
                },
              },
            },
            {
              variants: {
                some: {
                  productId: product.id,
                  optionType: "Size",
                  value: size,
                },
              },
            },
          ],
        },
      });

      if (oldPrice && priceInCents < oldPrice.priceInCents) {
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
            AND: [
              {
                variants: {
                  some: {
                    productId: product.id,
                    optionType: "Color",
                    value: color,
                  },
                },
              },
              {
                variants: {
                  some: {
                    productId: product.id,
                    optionType: "Size",
                    value: size,
                  },
                },
              },
            ],
          },
        });

        await Promise.all([
          notifications.map(async (notification) => {
            const user = await prisma.user.findUniqueOrThrow({
              where: { id: notification.userId },
            });

            console.log(user.email);
          }),
        ]);
      }

      await createPricePromise;
    })
  );
}

async function getProductPrices(productCode: string) {
  const pricesEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;

  const [pricesData, detailsData] = await Promise.all([
    (await fetch(pricesEndpoint)).json(),
    (await fetch(detailsEndpoint)).json(),
  ]);

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

  const prices: Price[] = Object.keys(stocks).map((key, index) => {
    const colorDisplayCode = l2s[index].color.displayCode.toString();
    const sizeDisplayCode = l2s[index].size.displayCode.toString();
    const price = pricesObject[key].base.value.toString();
    const stock = parseInt(stocks[key].quantity);
    return {
      color: colorsRecord[colorDisplayCode],
      size: sizesRecord[sizeDisplayCode],
      priceInCents: dollarsToCents(price),
      stock,
    };
  });

  return prices;
}
