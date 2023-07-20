import axios from "axios";

import { dollarsToCents, toTitleCase } from "../../utils/formatter";
import { getHttpsProxyAgent } from "../../utils/proxy";
import { StoreAdapter, VariantAttribute, VariantInfo } from "../../utils/types";
import { detailsSchema, l2sSchema, Option, productsSchema } from "./schemas";

const UniqloUS: StoreAdapter = {
  urlPrefixes: ["uniqlo.com/us/"],
  storeHandle: "uniqlo-us",
  getProducts,
  getProductCode,
  getProductDetails,
};
export default UniqloUS;

async function getProducts(limit?: number, useProxy = false) {
  const productsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products`;
  const productCodes: string[] = [];

  const increment = 100;

  for (let [offset, total] = [0, limit ?? increment]; offset < total; offset += increment) {
    const params = { offset, limit: Math.min(total - offset, increment), httpFailure: true };
    const httpsAgent = getHttpsProxyAgent(useProxy);
    const productsResponse = await axios.get(productsEndpoint, { httpsAgent, params });

    if (productsResponse.status !== 200) {
      throw new Error(`Failed to get products. Status code: ${productsResponse.status}`);
    }

    const productsData = productsSchema.parse(productsResponse.data);
    if (productsData.status === "nok") {
      throw new Error(`Failed to get products`);
    }

    const { items, pagination } = productsData.result;
    productCodes.push(...items.map((item) => item.productId));

    if (!limit) {
      total = pagination.total;
    }
  }

  return productCodes;
}

async function getProductCode(url: string, useProxy = false) {
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

async function getProductDetails(productCode: string, useProxy = false) {
  const l2sEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const httpsAgent = getHttpsProxyAgent(useProxy);

  const [l2sResponse, detailsResponse] = await axios.all([
    axios.get(l2sEndpoint, { httpsAgent }),
    axios.get(detailsEndpoint, { httpsAgent }),
  ]);
  const timestamp = new Date();

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

  const variants: VariantInfo[] = [];
  let [hasColor, hasSize, hasLength] = [false, false, false];
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
    if (color.display.showFlag) {
      attributes.push({ name: "Color", value: toTitleCase(`${color.displayCode} ${color.name}`) });
      hasColor = true;
    }
    if (size.display.showFlag) {
      attributes.push({ name: "Size", value: size.name });
      hasSize = true;
    }
    if (pld.display.showFlag) {
      attributes.push({ name: "Length", value: pld.name });
      hasLength = true;
    }

    variants.push({
      timestamp,
      productUrl: getProductUrl(productCode, { color, size, pld }),
      attributes,
      priceInCents: dollarsToCents(pricesEntry.base.value.toString()),
      inStock: stocksEntry.quantity > 0,
    });
  });

  // filter variants that don't have all attributes
  const filteredVariants = variants.filter(({ attributes, inStock }) => {
    const priceHasColor = attributes.some((attribute) => attribute.name === "Color");
    const priceHasSize = attributes.some((attribute) => attribute.name === "Size");
    const priceHasLength = attributes.some((attribute) => attribute.name === "Length");
    const hasAllAttributes =
      (priceHasColor || !hasColor) && (priceHasSize || !hasSize) && (priceHasLength || !hasLength);
    return hasAllAttributes || inStock;
  });

  return {
    name,
    variants: filteredVariants,
  };
}

const getProductUrl = (
  productCode: string,
  attributes: { color?: Option; size?: Option; pld?: Option },
) => {
  const { color, size, pld } = attributes;
  const productUrl = new URL(`https://www.uniqlo.com/us/en/products/${productCode}/`);

  if (color) productUrl.searchParams.append("colorDisplayCode", color.displayCode);
  if (size) productUrl.searchParams.append("sizeDisplayCode", size.displayCode);
  if (pld) productUrl.searchParams.append("pldDisplayCode", pld.displayCode);

  return productUrl.href;
};
