import axios, { AxiosProxyConfig } from "axios";

import { dollarsToCents, toTitleCase } from "../utils/formatter";
import { ProductPrice } from "../utils/types";
import { detailsSchema, l2sSchema, productsSchema } from "./schemas";

const colorsStylizer = (color: { code: string; name: string; displayCode: string }) => {
  return {
    ...color,
    stylizedName: toTitleCase(`${color.displayCode} ${color.name}`),
  };
};
const sizeStylizer = (size: { code: string; name: string; displayCode: string }) => {
  return {
    ...size,
    stylizedName: size.name,
  };
};

const proxy: AxiosProxyConfig = {
  protocol: "http",
  host: "p.webshare.io",
  port: 80,
  auth: {
    username: process.env.WEBSHARE_USERNAME!,
    password: process.env.WEBSHARE_PASSWORD!,
  },
};

export async function getProducts(offset: number = 0, limit: number = 36, useProxy = false) {
  const productsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products?offset=${offset}&limit=${limit}&httpFailure=true`;
  const productsResponse = await axios.get(productsEndpoint, useProxy ? { proxy } : undefined);

  if (productsResponse.status !== 200) {
    throw new Error(`Failed to get products. Status code: ${productsResponse.status}`);
  }

  const { items, pagination } = productsSchema.parse(productsResponse.data).result;

  const products = items.map((item) => {
    const styles = item.colors.map((color) => colorsStylizer(color));
    const sizes = item.sizes.map((size) => sizeStylizer(size));
    return {
      name: item.name,
      productCode: item.productId,
      styles,
      sizes,
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

  const { stocks, prices, l2s } = l2sSchema.parse(l2sResponse.data).result;
  const detailsResult = detailsSchema.parse(detailsResponse.data).result;

  const styles = detailsResult.colors.map((color) => colorsStylizer(color));
  const sizes = detailsResult.sizes.map((size) => sizeStylizer(size));

  const productPrices: ProductPrice[] = [];

  l2s.forEach(({ color, size, l2Id }) => {
    const stocksEntry = stocks[l2Id];
    const pricesEntry = prices[l2Id];

    if (!pricesEntry || !stocksEntry) {
      return;
    }

    const colorName = styles.find((s) => s.code === color.code);
    const sizeName = sizes.find((s) => s.code === size.code);
    const priceInCents = dollarsToCents(pricesEntry.base.value.toString());
    const stock = stocksEntry.quantity;

    if (!colorName || !sizeName) throw new Error("Failed to parse product details");

    productPrices.push({
      style: colorName.stylizedName,
      size: sizeName.stylizedName,
      priceInCents,
      stock,
    });
  });

  return {
    name: detailsResult.name,
    styles,
    sizes,
    prices: productPrices,
  };
}
