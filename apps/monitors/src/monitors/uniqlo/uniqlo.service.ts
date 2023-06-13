import { dollarsToCents } from "../../utils/currency";
import { toTitleCase } from "../../utils/formatter";
import {
  AddProductRequest,
  AddProductResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  UniqloType,
} from "./uniqlo.types";
import prisma from "../../utils/database";

export async function handleHeartbeat({
  productCode,
}: HeartbeatRequest): Promise<HeartbeatResponse> {
  const store = await getStore();
  if (!store) {
    return {
      status: "error",
      error: "Uniqlo US missing from stores table",
    };
  }

  const product = await getProduct(store.id, productCode);
  if (!product) {
    return {
      status: "error",
      error: "Product missing from products table",
    };
  }

  const prices = await getPrices(productCode);
  if (prices.length === 0) {
    console.warn(`Product ${productCode} has empty data`);
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

  return {
    status: "success",
  };
}

export async function addProduct({ productCode }: AddProductRequest): Promise<AddProductResponse> {
  // TODO: remove get store? -> only one SQL query?
  const store = await getStore();
  if (!store) {
    return {
      status: "error",
      error: "Uniqlo US missing from stores table",
    };
  }

  const product = await getProduct(store.id, productCode);
  if (product !== null) {
    return {
      status: "error",
      error: "Product already in products table",
    };
  }

  const { name, colorsRecord, sizesRecord } = await getDetails(productCode);

  await prisma.product.create({
    data: {
      productCode,
      name,
      storeId: store.id,
      variant: {
        createMany: {
          data: [
            ...Object.values(colorsRecord).map((color) => ({
              optionType: "Color",
              value: color,
            })),
            ...Object.values(sizesRecord).map((size) => ({
              optionType: "Size",
              value: size,
            })),
          ],
        },
      },
    },
  });

  return {
    status: "success",
  };
}

function getStore() {
  return prisma.store.findUnique({ where: { handle: "uniqlo-us" } });
}

function getProduct(storeId: string, productCode: string) {
  return prisma.product.findUnique({
    where: { storeId_productCode: { storeId, productCode } },
  });
}

async function getPrices(productCode: string) {
  const pricesEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const [pricesResponse, { colorsRecord, sizesRecord }] = await Promise.all([
    fetch(pricesEndpoint),
    getDetails(productCode),
  ]);
  const { stocks, prices: pricesObject, l2s } = (await pricesResponse.json()).result;

  const prices: {
    color: string;
    size: string;
    priceInCents: number;
    stock: number;
  }[] = [];

  Object.keys(stocks).forEach((key, index) => {
    const colorDisplayCode = l2s[index].color.displayCode.toString();
    const sizeDisplayCode = l2s[index].size.displayCode.toString();
    const price = pricesObject[key].base.value.toString();
    const stock = parseInt(stocks[key].quantity);
    prices.push({
      color: colorsRecord[colorDisplayCode],
      size: sizesRecord[sizeDisplayCode],
      priceInCents: dollarsToCents(price),
      stock,
    });
  });

  return prices;
}

async function getDetails(productCode: string) {
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const detailsResponse = await fetch(detailsEndpoint);
  const { name, colors, sizes }: { name: string; colors: UniqloType[]; sizes: UniqloType[] } = (
    await detailsResponse.json()
  ).result;

  const colorsRecord: Record<string, string> = {};
  colors.forEach((color) => {
    colorsRecord[color.displayCode] = toTitleCase(`${color.displayCode} ${color.name}`);
  });

  const sizesRecord: Record<string, string> = {};
  sizes.forEach((size) => {
    sizesRecord[size.displayCode] = size.name;
  });

  return { name, colorsRecord, sizesRecord };
}
