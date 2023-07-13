import axios from "axios";

import { dollarsToCents, toTitleCase } from "../../utils/formatter";
import { getHttpsProxyAgent } from "../../utils/proxy";
import { ProductPrice, StoreAdapter, VariantAttribute } from "../../utils/types";
import { DetailedOption, detailsSchema, l2sSchema, productsSchema } from "./schemas";

export const UniqloUS: StoreAdapter = {
  getProductCode,
  getProductDetails,
};

const getColorName = (color: DetailedOption) => toTitleCase(`${color.displayCode} ${color.name}`);
const getSizeName = (size: DetailedOption) => size.name;
const getPldName = (pld: DetailedOption) => pld.name;

export async function getProducts(offset: number = 0, limit: number = 36, useProxy = false) {
  const productsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products?offset=${offset}&limit=${limit}&httpFailure=true`;
  const httpsAgent = getHttpsProxyAgent(useProxy);

  const productsResponse = await axios.get(productsEndpoint, { httpsAgent });
  if (productsResponse.status !== 200) {
    throw new Error(`Failed to get products. Status code: ${productsResponse.status}`);
  }

  const productsData = productsSchema.parse(productsResponse.data);
  if (productsData.status === "nok") {
    throw new Error(`Failed to get products`);
  }

  const { items, pagination } = productsData.result;
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

export async function getProductCode(url: string, useProxy = false) {
  const productCodeRegex = /([a-zA-Z0-9]{7}-[0-9]{3})/;
  const matches = url.match(productCodeRegex);

  const productCode = matches?.[0];
  if (!productCode) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const httpsAgent = getHttpsProxyAgent(useProxy);

  const searchResponse = await axios.get(detailsEndpoint, { httpsAgent });
  if (searchResponse.status !== 200) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  const detailsResult = detailsSchema.parse(searchResponse.data);
  if (detailsResult.status === "nok") {
    throw new Error(`Failed to get product code from ${url}`);
  }

  return productCode;
}

export async function getProductDetails(productCode: string, useProxy = false) {
  const l2sEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const httpsAgent = getHttpsProxyAgent(useProxy);

  const [l2sResponse, detailsResponse] = await axios.all([
    axios.get(l2sEndpoint, { httpsAgent }),
    axios.get(detailsEndpoint, { httpsAgent }),
  ]);

  if (l2sResponse?.status !== 200 || detailsResponse?.status !== 200) {
    throw new Error(
      `Failed to get product details for ${productCode}. Status codes: ${l2sResponse?.status} and ${detailsResponse?.status}`,
    );
  }

  const [l2sData, detailsData] = [
    l2sSchema.parse(l2sResponse.data),
    detailsSchema.parse(detailsResponse.data),
  ];

  if (l2sData.status === "nok" || detailsData.status === "nok") {
    throw new Error(`Failed to get product details for ${productCode}`);
  }

  const { l2s, stocks, prices } = l2sData.result;
  const { name, ...options } = detailsData.result;

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

    const attributes: VariantAttribute[] = [];
    if (color.display.showFlag) attributes.push({ name: "Color", value: getColorName(color) });
    if (size.display.showFlag) attributes.push({ name: "Size", value: getSizeName(size) });
    if (pld.display.showFlag) attributes.push({ name: "Length", value: getPldName(pld) });

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

function getVariantAttributes(options: Record<string, string[]>): VariantAttribute[][] {
  const entry = Object.entries(options).at(0);
  if (!entry) {
    return [[]];
  }

  const [key, values] = entry;
  delete options[key];
  const otherVariants = getVariantAttributes(options);

  return values.flatMap((value) =>
    otherVariants.map((variant) => [{ name: key, value }, ...variant]),
  );
}
