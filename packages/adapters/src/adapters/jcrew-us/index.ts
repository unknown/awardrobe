import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { AdaptersError, handleAxiosError } from "../errors";
import { StoreAdapter, VariantInfo } from "../types";
import { productInfoSchema } from "./schemas";

const headers = {
  "User-Agent": "JCrew/1.0.8 (com.jcrew.jcrew; build:686; iOS 16.5.1) Alamofire/5.7.1",
};

export const JCrewUS: StoreAdapter = {
  urlRegex: /^(?:www.)?jcrew\.com/,
  storeHandle: "jcrew-us",

  async getProducts(_) {
    // TODO: implement
    return new Set();
  },

  async getProductCode(url: string) {
    const productCodeRegex = /\/([a-zA-Z0-9]+)/g;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.at(-1)?.slice(1);
    if (!productCode) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Regex failed to get product code",
      });
    }

    return productCode;
  },

  async getProductDetails(productCode: string) {
    const productEndpoint = `https://app.jcrew.com/browse/products/${productCode}`;
    const params = {
      "country-code": "US",
      display: "standard",
      expand: "availability,prices,variations,set_products",
      locale: "en-US",
    };
    const productResponse = await proxiedAxios
      .get(productEndpoint, { headers, params })
      .catch(handleAxiosError);
    const timestamp = new Date();

    const result = productInfoSchema.safeParse(productResponse.data);
    if (!result.success) {
      throw new AdaptersError({
        name: "INVALID_RESPONSE",
        message: "Failed to parse product response",
        cause: result.error,
      });
    }

    const { name } = result.data;
    const products = "set_products" in result.data ? result.data.set_products : [result.data];

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
            value: attributeValue ?? value,
          };
        });
        return {
          timestamp,
          attributes,
          productUrl: "", // TODO: implement
          inStock: variant.orderable,
          priceInCents: dollarsToCents(variant.price.toString()),
        };
      });
    });

    return {
      name,
      variants,
      description: products[0]?.long_description,
      imageUrl: products[0]?.c_imageURL,
    };
  },
};
