import axios from "axios";

import { dollarsToCents, toTitleCase } from "../../utils/formatter";
import { getHttpsProxyAgent } from "../../utils/proxy";
import { ProductPrice, StoreAdapter, VariantAttribute } from "../../utils/types";
import { productCollectionSchema, searchSchema } from "./schemas";

export const AbercrombieUS: StoreAdapter = {
  getProductCode,
  getProductDetails,
};

async function getProductCode(url: string, useProxy = false) {
  const productCodeRegex = /\/p\/(([a-zA-Z0-9-]+))/;
  const matches = url.match(productCodeRegex);

  const productCode = matches?.[1];
  if (!productCode) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  const searchEndpoint = "https://www.abercrombie.com/api/search/a-us/search/departments";
  const params = { version: "1.2", searchTerm: productCode };
  const httpsAgent = getHttpsProxyAgent(useProxy);

  const searchResponse = await axios.get(searchEndpoint, { params, httpsAgent });
  if (searchResponse.status !== 200) {
    throw new Error(
      `Failed to search for product ${productCode}. Status code: ${searchResponse.status}`,
    );
  }

  const searchResults = searchSchema.parse(searchResponse.data);
  let collectionId: string | undefined;
  searchResults.forEach((searchResult) => {
    searchResult.results.products?.forEach((product) => {
      if (product.productSeoToken.endsWith(productCode)) {
        collectionId = product.collection;
      }
    });
  });

  if (!collectionId) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  return collectionId;
}

async function getProductDetails(productCode: string, useProxy = false) {
  const collectionEndpoint = `https://www.abercrombie.com/api/search/a-us/product/collection/${productCode}`;
  const httpsAgent = getHttpsProxyAgent(useProxy);

  const collectionResponse = await axios.get(collectionEndpoint, { httpsAgent });

  if (collectionResponse.status !== 200) {
    throw new Error(
      `Failed to get product details for ${productCode}. Status code: ${collectionResponse.status}`,
    );
  }

  const { products } = productCollectionSchema.parse(collectionResponse.data);

  if (products[0] === undefined) {
    throw new Error(`Failed to get product details for ${productCode}. No products found.`);
  }

  const prices: ProductPrice[] = [];
  const variants: VariantAttribute[][] = [];
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
          const value = attribute.name === "Color" ? toTitleCase(attribute.value) : attribute.value;
          return { name: attribute.description, value };
        });

      const lowestPrice = Math.min(
        product.lowContractPrice,
        product.highContractPrice,
        item.offerPrice,
        item.listPrice,
      );

      prices.push({
        attributes,
        inStock: item.inventory.inventory > 0,
        priceInCents: dollarsToCents(lowestPrice.toString()),
      });
      variants.push(attributes);
    });
  });

  return { name: products[0].name, prices, variants };
}
