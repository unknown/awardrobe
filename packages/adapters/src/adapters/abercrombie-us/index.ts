import axios from "axios";
import parse from "node-html-parser";

import { getRandomHttpsProxyAgent } from "@awardrobe/proxies";

import { dollarsToCents, toTitleCase } from "../../utils/formatter";
import { StoreAdapter, VariantInfo } from "../../utils/types";
import { collectionSchema, Item, Product, searchSchema } from "./schemas";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
};

function getProductUrl(product: Product, item: Item) {
  const productUrl = new URL(`https://www.abercrombie.com/shop/us/${product.productSeoToken}`);
  const color = item.definingAttrs.Color?.sequence.toString();

  if (color) productUrl.searchParams.set("seq", color);

  return productUrl.href;
}

export const AbercrombieUS: StoreAdapter = {
  urlPrefixes: ["abercrombie.com/shop/us/"],
  storeHandle: "abercrombie-us",

  getProducts: async function getProducts(limit?: number) {
    // category 10000 represents all of A&F
    const searchEndpoint = `https://www.abercrombie.com/api/search/a-us/search/category/10000`;

    const productCodes: string[] = [];
    const increment = 100;

    for (let [offset, total] = [0, limit ?? increment]; offset < total; offset += increment) {
      const params = { start: offset, rows: Math.min(total - offset, increment), swatches: false };
      const httpsAgent = getRandomHttpsProxyAgent();
      const searchResponse = await axios.get(searchEndpoint, { httpsAgent, params, headers });

      if (searchResponse.status !== 200) {
        throw new Error(`Failed to get products. Status code: ${searchResponse.status}`);
      }

      const { products, stats } = searchSchema.parse(searchResponse.data);

      productCodes.push(...products.map((product) => product.collection));

      if (!limit) {
        total = stats.total;
      }
    }

    return productCodes;
  },

  getProductCode: async function getProductCode(url: string) {
    const productCodeRegex = /\/p\/([a-zA-Z0-9-]+)/;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.[1];
    if (!productCode) {
      throw new Error(`Failed to get product code from ${url}`);
    }

    const productEndpoint = `https://www.abercrombie.com/shop/us/p/${productCode}`;
    const httpsAgent = getRandomHttpsProxyAgent();

    const productResponse = await axios.get(productEndpoint, { httpsAgent, headers });

    if (productResponse.status !== 200) {
      throw new Error(
        `Failed to search for product ${productCode}. Status code: ${productResponse.status}`,
      );
    }

    const root = parse(productResponse.data);
    const collectionId = root
      .querySelector("meta[name=branch:deeplink:collectionID]")
      ?.getAttribute("content");

    if (!collectionId) {
      throw new Error(`Failed to get product code from ${url}`);
    }

    return collectionId;
  },

  // TODO: investigate why the endpoint returns false inventory data sometimes
  getProductDetails: async function getProductDetails(productCode: string) {
    const collectionEndpoint = `https://www.abercrombie.com/api/search/a-us/product/collection/${productCode}`;
    const httpsAgent = getRandomHttpsProxyAgent();

    const collectionResponse = await axios.get(collectionEndpoint, { httpsAgent, headers });
    const timestamp = new Date();

    if (collectionResponse.status !== 200) {
      throw new Error(
        `Failed to get product details for ${productCode}. Status code: ${collectionResponse.status}`,
      );
    }

    const { products } = collectionSchema.parse(collectionResponse.data);

    if (products[0] === undefined) {
      throw new Error(`Failed to get product details for ${productCode}. No products found.`);
    }

    const variants: VariantInfo[] = [];
    products.forEach((product) => {
      if (!product.items[0]) return;

      // sort items by attribute value sequence so that variants are ordered properly
      Object.keys(product.items[0].definingAttrs).forEach((key) => {
        product.items.sort((a, b) => {
          const [aAttr, bAttr] = [a.definingAttrs[key], b.definingAttrs[key]];
          if (!aAttr || !bAttr) return 0;
          return aAttr.valueSequence - bAttr.valueSequence;
        });
      });

      product.items.forEach((item) => {
        // the size is stored in individual grouped attributes and in a single composite attribute
        // we only want the grouped attributes
        const attributes = Object.values(item.definingAttrs)
          .sort((a, b) => {
            // move grouped attributes to the back
            if (a.name.startsWith("Size_")) return 1;
            if (b.name.startsWith("Size_")) return -1;
            // sort by sequence
            return a.sequence - b.sequence;
          })
          .filter((attribute) => attribute.name !== "Size") // remove composite attribute
          .map((attribute) => {
            const value =
              attribute.name === "Color"
                ? toTitleCase(`${attribute.sequence} ${attribute.value}`)
                : attribute.value;
            return { name: attribute.description, value };
          });

        const lowestPrice = Math.min(
          product.lowContractPrice ?? Infinity,
          product.highContractPrice ?? Infinity,
          item.offerPrice,
          item.listPrice,
        );

        variants.push({
          timestamp,
          productUrl: getProductUrl(product, item),
          attributes,
          inStock: item.inventory.inventory > 0,
          priceInCents: dollarsToCents(lowestPrice.toString()),
        });
      });
    });

    // TODO: handle variants with different names
    return {
      name: products[0].name,
      variants,
    };
  },
};
