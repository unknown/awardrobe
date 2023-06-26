import z from "zod";

import { toTitleCase } from "../utils/formatter";
import { ProductDetails } from "../utils/types";

// contains stock and price data of products
const l2sSchema = z.object({
  result: z.object({
    l2s: z.array(
      z.object({
        color: z.object({
          code: z.string(),
          displayCode: z.string(),
        }),
        size: z.object({
          code: z.string(),
          displayCode: z.string(),
        }),
      }),
    ),
    stocks: z.record(z.string(), z.object({ quantity: z.number() })),
    prices: z.record(z.string(), z.object({ base: z.object({ value: z.number() }) })),
  }),
});

// contains human-readable names for colors and sizes
const detailsSchema = z.object({
  result: z.object({
    name: z.string(),
    colors: z.array(
      z.object({
        code: z.string(),
        displayCode: z.string(),
        name: z.string(),
      }),
    ),
    sizes: z.array(
      z.object({
        code: z.string(),
        displayCode: z.string(),
        name: z.string(),
      }),
    ),
  }),
});

export async function getProductDetails(productCode: string) {
  const l2sEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;

  const [rawL2sData, rawDetailsData] = await Promise.all([
    (await fetch(l2sEndpoint)).json(),
    (await fetch(detailsEndpoint)).json(),
  ]);

  const l2sData = l2sSchema.parse(rawL2sData);
  const detailsData = detailsSchema.parse(rawDetailsData);

  const { stocks, prices, l2s } = l2sData.result;
  const { name, colors, sizes } = detailsData.result;

  // lookup for human-readable names to display codes (e.g. "08" -> "08 Dark Gray")
  const nameByDisplayCode: Map<string, string> = new Map();
  colors.forEach((color) => {
    nameByDisplayCode.set(color.displayCode, toTitleCase(`${color.displayCode} ${color.name}`));
  });
  sizes.forEach((size) => {
    nameByDisplayCode.set(size.displayCode, size.name);
  });

  const details: ProductDetails[] = Object.keys(stocks).map((productId, index) => {
    const l2sEntry = l2s[index];
    const pricesEntry = prices[productId];
    const stocksEntry = stocks[productId];

    if (!l2sEntry || !pricesEntry || !stocksEntry) {
      throw new Error("Failed to parse product details");
    }

    const colorName = nameByDisplayCode.get(l2sEntry.color.displayCode);
    const sizeName = nameByDisplayCode.get(l2sEntry.size.displayCode);
    const priceInCents = pricesEntry.base.value * 100;
    const stock = stocksEntry.quantity;

    if (!colorName || !sizeName) throw new Error("Failed to parse product details");

    return {
      color: colorName,
      size: sizeName,
      priceInCents,
      stock,
    };
  });

  return { name, details };
}
