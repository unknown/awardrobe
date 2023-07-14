import axios from "axios";

import { dollarsToCents, toTitleCase } from "../../utils/formatter";
import { getHttpsProxyAgent } from "../../utils/proxy";
import { ProductPrice, StoreAdapter } from "../../utils/types";
import { collectionSchema, listSchema, searchSchema } from "./schemas";

const AbercrombieUS: StoreAdapter = {
  urlPrefixes: ["abercrombie.com/shop/us/"],
  storeHandle: "abercrombie-us",
  getProducts,
  getProductCode,
  getProductDetails,
};
export default AbercrombieUS;

async function getProducts(limit?: number, useProxy = false) {
  // category 10000 represents all of A&F
  const searchEndpoint = `https://www.abercrombie.com/api/search/a-us/search/category/10000`;
  const productCodes: string[] = [];

  const increment = 100;
  for (let [offset, total] = [0, limit ?? increment]; offset < total; offset += increment) {
    const params = { start: offset, rows: Math.min(total - offset, increment) };
    const httpsAgent = getHttpsProxyAgent(useProxy);
    const searchResponse = await axios.get(searchEndpoint, { httpsAgent, params });

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
}

async function getProductCode(url: string, useProxy = false) {
  const productCodeRegex = /\/p\/[a-zA-Z-]+([0-9]+)/;
  const matches = url.match(productCodeRegex);

  const productCode = matches?.[1];
  if (!productCode) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  const listEndpoint = "https://www.abercrombie.com/api/search/a-us/product/list/";
  const params = { productIds: productCode };
  const httpsAgent = getHttpsProxyAgent(useProxy);
  const listResponse = await axios.get(listEndpoint, { params, httpsAgent });

  if (listResponse.status !== 200) {
    throw new Error(
      `Failed to search for product ${productCode}. Status code: ${listResponse.status}`,
    );
  }

  const { products } = listSchema.parse(listResponse.data);

  let collectionId: string | undefined;
  products.forEach((product) => {
    if (product.productId === productCode) {
      collectionId = product.collection;
    }
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

  const { products } = collectionSchema.parse(collectionResponse.data);

  if (products[0] === undefined) {
    throw new Error(`Failed to get product details for ${productCode}. No products found.`);
  }

  const prices: ProductPrice[] = [];
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
        product.lowContractPrice ?? Infinity,
        product.highContractPrice ?? Infinity,
        item.offerPrice,
        item.listPrice,
      );

      prices.push({
        productUrl: getProductUrl(product.productSeoToken),
        attributes,
        inStock: item.inventory.inventory > 0,
        priceInCents: dollarsToCents(lowestPrice.toString()),
      });
    });
  });

  // TODO: handle variants with different names
  return {
    name: products[0].name,
    prices,
  };
}

const getProductUrl = (productSeoToken: string) => {
  const productUrl = new URL(`https://www.abercrombie.com/shop/us/${productSeoToken}`);
  return productUrl.href;
};
