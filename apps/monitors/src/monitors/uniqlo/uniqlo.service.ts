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
import { Prisma } from "database";

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

  const [prices, { colors, sizes }] = await Promise.all([
    getPrices(productCode),
    getDetails(productCode),
  ]);
  if (prices.length === 0) {
    console.warn(`Product ${productCode} has empty data`);
  }

  const timestamp = new Date();

  const entries: Prisma.PriceCreateInput[] = prices.map(
    ({ colorDisplayCode, sizeDisplayCode, priceInCents, stock }) => ({
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
                value: colors[colorDisplayCode],
              },
            },
            create: {
              productId: product.id,
              optionType: "Color",
              value: colors[colorDisplayCode],
            },
          },
          {
            where: {
              productId_optionType_value: {
                productId: product.id,
                optionType: "Size",
                value: sizes[sizeDisplayCode],
              },
            },
            create: {
              productId: product.id,
              optionType: "Size",
              value: sizes[sizeDisplayCode],
            },
          },
        ],
      },
    })
  );

  await Promise.all(
    entries.map(async (entry) => {
      await prisma.price.create({ data: entry });
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

  const { name, colors, sizes } = await getDetails(productCode);

  await prisma.product.create({
    data: {
      productCode,
      name,
      storeId: store.id,
      variant: {
        createMany: {
          data: [
            ...Object.values(colors).map((color) => ({
              optionType: "Color",
              value: color,
            })),
            ...Object.values(sizes).map((size) => ({
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
  const pricesResponse = await fetchPricesData(productCode);
  const { stocks, prices: pricesObject, l2s } = (await pricesResponse.json()).result;

  const prices: {
    colorDisplayCode: string;
    sizeDisplayCode: string;
    priceInCents: number;
    stock: number;
  }[] = [];
  Object.keys(stocks).forEach((key, index) => {
    prices.push({
      colorDisplayCode: l2s[index].color.displayCode.toString(),
      sizeDisplayCode: l2s[index].size.displayCode.toString(),
      priceInCents: dollarsToCents(pricesObject[key].base.value.toString()),
      stock: parseInt(stocks[key].quantity),
    });
  });
  return prices;
}

async function getDetails(productId: string) {
  const detailsResponse = await fetchDetailsData(productId);
  const { name, colors, sizes } = (await detailsResponse.json()).result;

  const colorsRecord: Record<string, string> = {};
  colors.forEach((color: UniqloType) => {
    colorsRecord[color.displayCode] = toTitleCase(color.name);
  });
  const sizesRecord: Record<string, string> = {};
  sizes.forEach((size: UniqloType) => {
    sizesRecord[size.displayCode] = size.name;
  });

  return { name, colors: colorsRecord, sizes: sizesRecord };
}

function fetchPricesData(productCode: string) {
  const pricesEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  return fetch(pricesEndpoint);
}

function fetchDetailsData(productCode: string) {
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  return fetch(detailsEndpoint);
}
