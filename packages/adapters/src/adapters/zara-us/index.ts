import parse from "node-html-parser";

import { proxies } from "@awardrobe/proxies";

import { axios } from "../../utils/axios";
import { toTitleCase } from "../../utils/formatter";
import { StoreAdapter, VariantInfo } from "../types";
import { productSchema } from "./schemas";

export const ZaraUS: StoreAdapter = {
  urlRegex: /^zara\.com\/us/,
  storeHandle: "zara-us",

  getProducts: async function getProducts(_?: number) {
    // TODO: implement
    return [];
  },

  getProductCode: async function getProductCode(url: string) {
    const { httpsAgent } = proxies.getRandomProxy();
    const initialResponse = await axios.get(url, { httpsAgent });

    if (initialResponse.status !== 200) {
      throw new Error(
        `Failed to search for product ${url}. Status code: ${initialResponse.status}`,
      );
    }

    const initialRoot = parse(initialResponse.data);
    const challengeRegex = /URL='(.*)'/;
    const challengeRoute = initialRoot
      .querySelector('meta[http-equiv="refresh"]')
      ?.getAttribute("content")
      ?.match(challengeRegex)?.[1];

    if (!challengeRoute) {
      throw new Error(`Failed to get product code from ${url}`);
    }
    const challengeUrl = `https://www.zara.com${challengeRoute}`;

    const productResponse = await axios.get(challengeUrl, { httpsAgent });
    const root = parse(productResponse.data);

    const htmlId = root.querySelector("html")?.getAttribute("id");
    const productId = htmlId?.split("-").pop();

    if (!productId) {
      throw new Error(`Failed to get product code from ${url}`);
    }

    return productId;
  },

  getProductDetails: async function getProductDetails(productCode: string) {
    const productEndpoint = `https://www.zara.com/itxrest/4/catalog/store/11719/product/id/${productCode}`;
    const { httpsAgent } = proxies.getRandomProxy();
    const params = { locale: "en_US" };
    const productResponse = await axios.get(productEndpoint, { httpsAgent, params });
    const timestamp = new Date();

    if (productResponse.status !== 200) {
      throw new Error(
        `Failed to get product details for ${productCode}. Status code: ${productResponse.status}`,
      );
    }

    const { name, detail, seo } = productSchema.parse(productResponse.data);
    // TODO: per variant product urls

    const variants: VariantInfo[] = detail.colors.flatMap((color) => {
      const productUrl = `https://www.zara.com/us/en/${seo.keyword}-p${seo.seoProductId}.html?v1=${color.productId}`;
      return color.sizes.map((size) => ({
        timestamp,
        productUrl,
        attributes: [
          { name: detail.colorSelectorLabel, value: `${color.id} ${color.name}` },
          { name: "Size", value: size.name },
        ],
        inStock: size.availability !== "out_of_stock",
        priceInCents: size.price,
      }));
    });

    return {
      variants,
      name: toTitleCase(name),
    };
  },
};
