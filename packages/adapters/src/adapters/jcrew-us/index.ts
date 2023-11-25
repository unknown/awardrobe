import axios from "axios";

import { getRandomHttpsProxyAgent } from "@awardrobe/proxies";

import { dollarsToCents, toTitleCase } from "../../utils/formatter";
import { StoreAdapter, VariantInfo } from "../../utils/types";
import { productInfoSchema } from "./schemas";

const headers = {
  "User-Agent": "JCrew/1.0.8 (com.jcrew.jcrew; build:686; iOS 16.5.1) Alamofire/5.7.1",
};

export const JCrewUS: StoreAdapter = Object.freeze({
  urlPrefixes: ["jcrew.com"],
  storeHandle: "jcrew-us",

  getProducts: async function getProducts(_?: number) {
    // TODO: implement
    return [];
  },

  getProductCode: async function getProductCode(url: string) {
    const productCodeRegex = /\/([a-zA-Z0-9]+)/g;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.at(-1)?.slice(1);
    if (!productCode) {
      throw new Error(`Failed to get product code from ${url}`);
    }

    return productCode;
  },

  getProductDetails: async function getProductDetails(productCode: string) {
    const productEndpoint = `https://app.jcrew.com/browse/products/${productCode}`;
    const httpsAgent = getRandomHttpsProxyAgent();
    const params = {
      "country-code": "US",
      display: "standard",
      expand: "availability,prices,variations,set_products",
      locale: "en-US",
    };
    const productResponse = await axios.get(productEndpoint, { httpsAgent, headers, params });
    const timestamp = new Date();

    const productInfo = productInfoSchema.parse(productResponse.data);
    const products = "set_products" in productInfo ? productInfo.set_products : [productInfo];

    const variants: VariantInfo[] = products.flatMap((product) => {
      return product.variants.map((variant) => {
        const attributes = Object.entries(variant.variation_values).map(([key, value]) => {
          const attributeOptions = product.variation_attributes.find((attr) => attr.id === key);
          const attributeName = attributeOptions?.name;
          const attributeValue = attributeOptions?.values.find(
            (val) => val.value === variant.variation_values[key],
          )?.name;
          return {
            name: attributeName ?? key,
            value: toTitleCase(attributeValue ?? value),
          };
        });
        return {
          timestamp,
          attributes,
          productUrl: "",
          inStock: variant.orderable,
          priceInCents: dollarsToCents(variant.price.toString()),
        };
      });
    });

    return {
      variants,
      name: productInfo.name,
    };
  },
});
