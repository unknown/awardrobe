import parse from "node-html-parser";

import { proxiedAxios } from "@awardrobe/proxied-axios";

import { AdaptersError, handleAxiosError } from "../errors";
import { ProductDetails, StoreAdapter, VariantDetails } from "../types";
import { Product, productSchema } from "./schemas";

function getImageUrl(product: Product) {
  const media = product.detail.colors[0]?.shopcartMedia[0];

  if (!media) {
    return null;
  }

  const { path, name, timestamp } = media;
  return `https://static.zara.net/photos/${path}/${name}.jpg?ts=${timestamp}`;
}

export const ZaraUS: StoreAdapter = {
  urlRegex: /^(?:www.)?zara\.com\/us\//,
  storeHandle: "zara-us",

  async getListingIds(_) {
    // TODO: implement
    return new Set();
  },

  async getListingId(url) {
    const initialResponse = await proxiedAxios.get(url);

    const initialRoot = parse(initialResponse.data);
    const challengeRegex = /URL='(.*)'/;
    const challengeRoute = initialRoot
      .querySelector('meta[http-equiv="refresh"]')
      ?.getAttribute("content")
      ?.match(challengeRegex)?.[1];

    if (!challengeRoute) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Failed to get challenge route",
      });
    }

    const challengeUrl = `https://www.zara.com${challengeRoute}`;
    const productResponse = await proxiedAxios.get(challengeUrl);
    const root = parse(productResponse.data);

    const htmlId = root.querySelector("html")?.getAttribute("id");
    const productId = htmlId?.split("-").pop();

    if (!productId) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Failed to get product id",
      });
    }

    return productId;
  },

  async getListingDetails(productId) {
    const productEndpoint = `https://www.zara.com/itxrest/4/catalog/store/11719/product/id/${productId}`;
    const params = { locale: "en_US" };
    const productResponse = await proxiedAxios
      .get(productEndpoint, { params })
      .catch(handleAxiosError);
    const timestamp = new Date();

    const details = productSchema.safeParse(productResponse.data);
    if (!details.success) {
      throw new AdaptersError({
        name: "INVALID_RESPONSE",
        message: "Failed to parse product response",
        cause: details.error,
      });
    }

    const { name, detail, seo } = details.data;

    const variants: VariantDetails[] = detail.colors.flatMap((color) => {
      const productUrl = `https://www.zara.com/us/en/${seo.keyword}-p${seo.seoProductId}.html?v1=${color.productId}`;
      return color.sizes.map((size) => ({
        productUrl,
        attributes: [
          { name: detail.colorSelectorLabel, value: `${color.id} ${color.name}` },
          { name: "Size", value: size.name },
        ],
        price: {
          timestamp,
          inStock: size.availability !== "out_of_stock",
          priceInCents: size.price,
        },
      }));
    });

    const product: ProductDetails = {
      name,
      variants,
      productId: productId,
      description: seo.description,
      imageUrl: getImageUrl(details.data) ?? null,
    };

    return {
      brand: "zara",
      collectionId: productId,
      products: [product],
    };
  },
};
