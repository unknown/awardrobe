import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { AdaptersError, handleAxiosError } from "../errors";
import { ProductDetails, StoreAdapter, VariantDetails } from "../types";
import { productsSchema } from "./schemas";

const headers = {
  "User-Agent": "JCrew/1.0.8 (com.jcrew.jcrew; build:686; iOS 16.5.1) Alamofire/5.7.1",
};

export const JCrewUS: StoreAdapter = {
  urlRegex: /^(?:www.)?jcrew\.com/,
  storeHandle: "jcrew-us",

  async getListingIds(_) {
    // TODO: implement
    return new Set();
  },

  async getListingId(url) {
    const listingIdRegex = /\/([a-zA-Z0-9]+)/g;
    const matches = url.match(listingIdRegex);

    const listingId = matches?.at(-1)?.slice(1);
    if (!listingId) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Regex failed to get listing id",
      });
    }

    const params = {
      "country-code": "US",
      display: "standard",
      locale: "en-US",
    };
    const productsEndpoint = `https://app.jcrew.com/browse/products/${listingId}`;
    const productsResponse = await proxiedAxios.get(productsEndpoint, { headers, params }); // TODO: throw PRODUCT_CODE_NOT_FOUND if 404

    const result = productsSchema.safeParse(productsResponse.data);
    if (!result.success) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Failed to parse products response",
        cause: result.error,
      });
    }

    return "set_products" in result.data ? result.data.id : result.data.c_familyId;
  },

  async getListingDetails(listingId) {
    const productsEndpoint = `https://app.jcrew.com/browse/products/${listingId}`;
    const params = {
      "country-code": "US",
      display: "standard",
      expand: "availability,prices,variations,set_products",
      locale: "en-US",
    };
    const productsResponse = await proxiedAxios
      .get(productsEndpoint, { headers, params })
      .catch(handleAxiosError);
    const timestamp = new Date();

    const result = productsSchema.safeParse(productsResponse.data);
    if (!result.success) {
      throw new AdaptersError({
        name: "INVALID_RESPONSE",
        message: "Failed to parse product response",
        cause: result.error,
      });
    }

    const productsList = "set_products" in result.data ? result.data.set_products : [result.data];

    const products: ProductDetails[] = productsList.map((product) => {
      const variants: VariantDetails[] = product.variants.map((variant) => {
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
          attributes,
          variantId: variant.product_id,
          productUrl: "", // TODO: implement
          price: {
            timestamp,
            inStock: variant.orderable,
            priceInCents: dollarsToCents(variant.price.toString()),
          },
        };
      });

      return {
        variants,
        name: product.name,
        productId: product.id,
        description: product.long_description,
        imageUrl: product.c_imageURL,
      };
    });

    return {
      products,
      brand: "jcrew",
      collectionId: "set_products" in result.data ? result.data.id : result.data.c_familyId,
    };
  },
};
