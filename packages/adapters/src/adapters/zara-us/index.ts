import parse from "node-html-parser";

import { proxiedAxios } from "@awardrobe/proxied-axios";

import { StoreAdapter, VariantInfo } from "../types";
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

  async getProducts(_?: number) {
    // TODO: implement
    return [];
  },

  async getProductCode(url: string) {
    const initialResponse = await proxiedAxios.get(url);

    const initialRoot = parse(initialResponse.data);
    const challengeRegex = /URL='(.*)'/;
    const challengeRoute = initialRoot
      .querySelector('meta[http-equiv="refresh"]')
      ?.getAttribute("content")
      ?.match(challengeRegex)?.[1];

    if (!challengeRoute) {
      return null;
    }
    const challengeUrl = `https://www.zara.com${challengeRoute}`;

    const productResponse = await proxiedAxios.get(challengeUrl);
    const root = parse(productResponse.data);

    const htmlId = root.querySelector("html")?.getAttribute("id");
    const productId = htmlId?.split("-").pop();

    return productId ?? null;
  },

  async getProductDetails(productCode: string) {
    const productEndpoint = `https://www.zara.com/itxrest/4/catalog/store/11719/product/id/${productCode}`;
    const params = { locale: "en_US" };
    const productResponse = await proxiedAxios.get(productEndpoint, { params });
    const timestamp = new Date();

    const product = productSchema.parse(productResponse.data);
    const { name, detail, seo } = product;

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
      name,
      variants,
      description: seo.description,
      imageUrl: getImageUrl(product) ?? undefined,
    };
  },
};
