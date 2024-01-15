import parse from "node-html-parser";

import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { AdaptersError, handleAxiosError } from "../errors";
import { ProductDetails, StoreAdapter, VariantAttribute, VariantDetails } from "../types";
import { collectionSchema, Item, Product, searchSchema } from "./schemas";

function getProductUrl(product: Product, item: Item) {
  const productUrl = new URL(`https://www.abercrombie.com/shop/us/${product.productSeoToken}`);
  productUrl.searchParams.set("seq", item.swatchSequence);
  return productUrl.toString();
}

function getImageUrl(product: Product) {
  const prodImageId = product.imageSet["prod"]?.[0]?.id ?? null;

  let imageId = prodImageId;
  if (!imageId) {
    const fallbackKey = Object.keys(product.imageSet)[0];
    if (!fallbackKey) {
      return null;
    }
    imageId = product.imageSet[fallbackKey]?.[0]?.id ?? null;
    if (!imageId) {
      return null;
    }
  }

  return `https://img.abercrombie.com/is/image/anf/${imageId}.jpg?policy=product-large`;
}

export const AbercrombieUS: StoreAdapter = {
  urlRegex: /^(?:www.)?abercrombie\.com\/shop\/us\//,
  storeHandle: "abercrombie-us",

  async getListingIds(limit) {
    // category 10000 represents all of A&F
    const searchEndpoint = `https://www.abercrombie.com/api/search/a-us/search/category/10000`;

    const listingIds = new Set<string>();
    const increment = 240;

    for (let [offset, total] = [0, limit ?? increment]; offset < total; offset += increment) {
      const params = {
        start: offset,
        rows: Math.min(total - offset, increment),
        swatches: false,
      };
      const searchResponse = await proxiedAxios.get(searchEndpoint, { params });

      const result = searchSchema.safeParse(searchResponse.data);
      if (!result.success) {
        throw new AdaptersError({
          name: "INVALID_RESPONSE",
          message: "Failed to parse search response",
          cause: result.error,
        });
      }

      const { products, stats } = result.data;
      products.forEach((product) => listingIds.add(product.collection));

      if (!limit) {
        total = stats.total;
      }
    }

    return listingIds;
  },

  async getListingId(url) {
    const listingIdRegex = /\/p\/([a-zA-Z0-9-]+)/;
    const matches = url.match(listingIdRegex);

    const listingId = matches?.[1];
    if (!listingId) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Regex failed to get listing id",
      });
    }

    const productEndpoint = `https://www.abercrombie.com/shop/us/p/${listingId}`;
    const productResponse = await proxiedAxios.get(productEndpoint); // TODO: throw PRODUCT_CODE_NOT_FOUND if 404

    const root = parse(productResponse.data);
    const collectionId = root
      .querySelector("meta[name=branch:deeplink:collectionID]")
      ?.getAttribute("content");

    if (!collectionId) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Failed to get product code from product page",
      });
    }

    return collectionId;
  },

  async getListingDetails(listingId) {
    const collectionEndpoint = `https://www.abercrombie.com/api/search/a-us/product/collection/${listingId}`;
    const collectionResponse = await proxiedAxios.get(collectionEndpoint).catch(handleAxiosError);
    const timestamp = new Date();

    const result = collectionSchema.safeParse(collectionResponse.data);
    if (!result.success) {
      throw new AdaptersError({
        name: "INVALID_RESPONSE",
        message: "Failed to parse collection response",
        cause: result.error,
      });
    }

    // TODO: does an error need to be thrown here?
    if (result.data.products[0] === undefined) {
      throw new AdaptersError({
        name: "INVALID_RESPONSE",
        message: "Empty products array",
      });
    }

    const products: ProductDetails[] = result.data.products.map((product) => {
      if (!product.items[0]) {
        throw new AdaptersError({
          name: "INVALID_RESPONSE",
          message: "Empty items array",
        });
      }

      // sort "items" (variants) by each attribute's value sequence to ensure consistent ordering
      const attributesKeys = Object.keys(product.items[0].definingAttrs);
      attributesKeys.forEach((key) => {
        product.items.sort((a, b) => {
          const [aAttr, bAttr] = [a.definingAttrs[key], b.definingAttrs[key]];
          if (!aAttr || !bAttr) return 0;
          return aAttr.valueSequence - bAttr.valueSequence;
        });
      });

      const variants: VariantDetails[] = product.items.map((item) => {
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

        return {
          attributes,
          productUrl: getProductUrl(product, item),
          price: {
            timestamp,
            inStock: item.inventory.inventoryStatus === "Available",
            priceInCents: dollarsToCents(lowestPrice.toString()),
          },
        };
      });

      return {
        variants,
        name: product.name,
        productId: product.productId,
        description: product.longDesc,
        imageUrl: getImageUrl(product) ?? null,
      };
    });

    return {
      products,
      brand: "abercrombie",
      collectionId: result.data.collectionId,
    };
  },
};
