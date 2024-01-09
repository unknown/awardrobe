import parse from "node-html-parser";

import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { handleAxiosError } from "../errors";
import { StoreAdapter, VariantAttribute, VariantInfo } from "../types";
import { collectionSchema, Item, Product, searchSchema } from "./schemas";

function getProductUrl(product: Product, item: Item) {
  const productUrl = new URL(`https://www.abercrombie.com/shop/us/${product.productSeoToken}`);
  productUrl.searchParams.set("seq", item.swatchSequence);
  return productUrl.toString();
}

function getImageUrl(product: Product) {
  const imageId = product.imageSet.prod[0]?.id;

  if (!imageId) {
    return null;
  }

  return `https://img.abercrombie.com/is/image/anf/${imageId}.jpg?policy=product-large`;
}

export const AbercrombieUS: StoreAdapter = {
  urlRegex: /^(?:www.)?abercrombie\.com\/shop\/us\//,
  storeHandle: "abercrombie-us",

  async getProducts(limit?: number) {
    // category 10000 represents all of A&F
    const searchEndpoint = `https://www.abercrombie.com/api/search/a-us/search/category/10000`;

    const productCodes = new Set<string>();
    const increment = 240;

    for (let [offset, total] = [0, limit ?? increment]; offset < total; offset += increment) {
      const params = {
        start: offset,
        rows: Math.min(total - offset, increment),
        swatches: false,
      };
      const searchResponse = await proxiedAxios.get(searchEndpoint, { params });

      const { products, stats } = searchSchema.parse(searchResponse.data);

      products.forEach((product) => productCodes.add(product.collection));

      if (!limit) {
        total = stats.total;
      }
    }

    return productCodes;
  },

  async getProductCode(url: string) {
    const productCodeRegex = /\/p\/([a-zA-Z0-9-]+)/;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.[1];
    if (!productCode) {
      return null;
    }

    const productEndpoint = `https://www.abercrombie.com/shop/us/p/${productCode}`;
    const productResponse = await proxiedAxios.get(productEndpoint);

    const root = parse(productResponse.data);
    const collectionId = root
      .querySelector("meta[name=branch:deeplink:collectionID]")
      ?.getAttribute("content");

    return collectionId ?? null;
  },

  async getProductDetails(productCode: string) {
    const collectionEndpoint = `https://www.abercrombie.com/api/search/a-us/product/collection/${productCode}`;
    const collectionResponse = await proxiedAxios.get(collectionEndpoint).catch(handleAxiosError);
    const timestamp = new Date();

    const { products } = collectionSchema.parse(collectionResponse.data);

    if (products[0] === undefined) {
      throw new Error(`Failed to get product details for ${productCode}. No products found.`);
    }

    const variants: VariantInfo[] = [];
    products.forEach((product) => {
      if (!product.items[0]) return;

      // sort "items" (variants) by each attribute's value sequence to ensure consistent ordering
      const attributesKeys = Object.keys(product.items[0].definingAttrs);
      attributesKeys.forEach((key) => {
        product.items.sort((a, b) => {
          const [aAttr, bAttr] = [a.definingAttrs[key], b.definingAttrs[key]];
          if (!aAttr || !bAttr) return 0;
          return aAttr.valueSequence - bAttr.valueSequence;
        });
      });

      product.items.forEach((item) => {
        // the size is stored in individual grouped attributes and in a single composite attribute
        // we only want the grouped attributes
        const attributes: VariantAttribute[] = Object.values(item.definingAttrs)
          .filter((attribute) => attribute.name !== "Size") // remove composite size attribute (e.g. 28 X 32)
          .sort((a, b) => {
            // sort attributes, moving size attributes to the back and with primary sizes before secondary sizes
            const aScore = a.name.startsWith("Size_")
              ? a.name.endsWith("_P")
                ? 1e6
                : 1e7
              : a.sequence;

            const bScore = b.name.startsWith("Size_")
              ? b.name.endsWith("_P")
                ? 1e6
                : 1e7
              : b.sequence;

            return aScore - bScore;
          })
          .map((attribute) => {
            const value =
              attribute.name === "Color"
                ? `${attribute.sequence} ${attribute.value}`
                : attribute.value;
            return {
              value,
              name: attribute.description,
            };
          });

        const lowestPrice = Math.min(
          product.lowContractPrice ?? Infinity,
          product.highContractPrice ?? Infinity,
          item.offerPrice,
          item.listPrice,
        );

        variants.push({
          timestamp,
          attributes,
          productUrl: getProductUrl(product, item),
          inStock: item.inventory.inventoryStatus === "Available",
          priceInCents: dollarsToCents(lowestPrice.toString()),
        });
      });
    });

    // TODO: handle variants with different names
    return {
      variants,
      name: products[0].name,
      description: products[0].longDesc,
      imageUrl: getImageUrl(products[0]) ?? undefined,
    };
  },
};
