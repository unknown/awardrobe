import axios from "axios";

import { dollarsToCents, toTitleCase } from "../utils/formatter";
import { proxy } from "../utils/proxy";
import { ProductPrice } from "../utils/types";
import { DetailedOption, detailsSchema, l2sSchema, productsSchema } from "./schemas";

const getColorName = (color: DetailedOption) => toTitleCase(`${color.displayCode} ${color.name}`);
const getSizeName = (size: DetailedOption) => size.name;
const getPldName = (pld: DetailedOption) => pld.name;

export async function getProducts(offset: number = 0, limit: number = 36, useProxy = false) {
  const productsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products?offset=${offset}&limit=${limit}&httpFailure=true`;
  const productsResponse = await axios.get(productsEndpoint, useProxy ? { proxy } : undefined);

  if (productsResponse.status !== 200) {
    throw new Error(`Failed to get products. Status code: ${productsResponse.status}`);
  }

  const { items, pagination } = productsSchema.parse(productsResponse.data).result;

  const products = items.map(({ name, productId, ...options }) => {
    const formattedOptions = getFormattedOptions(options);
    return {
      name,
      productCode: productId,
      variants: getVariantAttributes(formattedOptions),
    };
  });

  return {
    products,
    pagination,
  };
}

export async function getProductDetails(productCode: string, useProxy = false) {
  const l2sEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const [l2sResponse, detailsResponse] = await axios.all([
    axios.get(l2sEndpoint, useProxy ? { proxy } : undefined),
    axios.get(detailsEndpoint, useProxy ? { proxy } : undefined),
  ]);

  if (l2sResponse?.status !== 200 || detailsResponse?.status !== 200) {
    throw new Error(
      `Failed to get product details for ${productCode}. Status codes: ${l2sResponse?.status} and ${detailsResponse?.status}`,
    );
  }

  const { l2s, stocks, prices } = l2sSchema.parse(l2sResponse.data).result;
  const { name, ...options } = detailsSchema.parse(detailsResponse.data).result;

  const productPrices: ProductPrice[] = [];
  l2s.forEach((variant) => {
    const stocksEntry = stocks[variant.l2Id];
    const pricesEntry = prices[variant.l2Id];
    if (!pricesEntry || !stocksEntry) {
      return;
    }

    const color = options.colors.find((color) => color.code === variant.color.code);
    const size = options.sizes.find((size) => size.code === variant.size.code);
    const pld = options.plds.find((pld) => pld.code === variant.pld.code);
    if (!color || !size || !pld) {
      throw new Error("Failed to parse product details");
    }

    const attributes: Record<string, string> = {};
    if (color.display.showFlag) attributes["Color"] = getColorName(color);
    if (size.display.showFlag) attributes["Size"] = getSizeName(size);
    if (pld.display.showFlag) attributes["Length"] = getPldName(pld);

    productPrices.push({
      attributes,
      priceInCents: dollarsToCents(pricesEntry.base.value.toString()),
      inStock: stocksEntry.quantity > 0,
    });
  });

  const formattedOptions = getFormattedOptions(options);

  return {
    name,
    prices: productPrices,
    variants: getVariantAttributes(formattedOptions),
  };
}

function getFormattedOptions(options: {
  colors: DetailedOption[];
  sizes: DetailedOption[];
  plds: DetailedOption[];
}) {
  const formattedOptions: Record<string, string[]> = {};

  const colors = options.colors
    .filter((color) => color.display.showFlag)
    .map((color) => getColorName(color));
  if (colors.length > 0) formattedOptions["Color"] = colors;

  const sizes = options.sizes
    .filter((size) => size.display.showFlag)
    .map((size) => getSizeName(size));
  if (sizes.length > 0) formattedOptions["Size"] = sizes;

  const lengths = options.plds.filter((pld) => pld.display.showFlag).map((pld) => getPldName(pld));
  if (lengths.length > 0) formattedOptions["Length"] = lengths;

  return formattedOptions;
}

function getVariantAttributes(options: Record<string, string[]>): Record<string, string>[] {
  const entries = Object.entries(options);
  if (entries.length <= 0) {
    return [{}];
  }

  const [key, values] = entries[entries.length - 1]!;
  delete options[key];

  const otherVariants = getVariantAttributes(options);
  return values.flatMap((value) => otherVariants.map((variant) => ({ [key]: value, ...variant })));
}
