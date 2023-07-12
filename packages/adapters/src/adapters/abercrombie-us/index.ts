import axios from "axios";

import { dollarsToCents } from "../../utils/formatter";
import { proxy } from "../../utils/proxy";
import { ProductPrice, VariantAttribute } from "../../utils/types";
import { productCollectionSchema, searchSchema } from "./schemas";

export async function getCollectionId(url: string, useProxy = false) {
  const productCodeRegex = /\/p\/(([a-zA-Z0-9-]+))/;
  const matches = url.match(productCodeRegex);

  const productCode = matches?.[1];
  if (!productCode) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  const searchEndpoint = "https://www.abercrombie.com/api/search/a-us/search/departments";
  const params = { version: "1.2", searchTerm: productCode };

  const searchResponse = await axios.get(searchEndpoint, { params, ...(useProxy ? proxy : {}) });
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

  return collectionId;
}

export async function getProductDetails(productCode: string, useProxy = false) {
  const collectionEndpoint = `https://www.abercrombie.com/api/search/a-us/product/collection/${productCode}`;
  const collectionResponse = await axios.get(collectionEndpoint, useProxy ? { proxy } : undefined);

  if (collectionResponse.status !== 200) {
    throw new Error(
      `Failed to get product details for ${productCode}. Status code: ${collectionResponse.status}`,
    );
  }

  const { products } = productCollectionSchema.parse(collectionResponse.data);

  if (products[0] === undefined) {
    throw new Error(`Failed to get product details for ${productCode}. No products found.`);
  }

  const name = products[0].name;
  const productPrices: ProductPrice[] = [];
  const variants: VariantAttribute[][] = [];
  products.forEach((product) => {
    product.items.forEach((item) => {
      const attributes = Object.entries(item.definingAttrs).map(([_, value]) => value);
      variants.push(attributes);
      productPrices.push({
        attributes,
        inStock: item.inventory.inventory > 0,
        priceInCents: dollarsToCents(item.offerPrice.toString()),
      });
    });
  });

  return { name, productPrices, variants };
}
