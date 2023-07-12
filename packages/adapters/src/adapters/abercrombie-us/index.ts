import axios from "axios";

import { dollarsToCents } from "../../utils/formatter";
import { proxy } from "../../utils/proxy";
import { ProductPrice, VariantAttribute } from "../../utils/types";
import { productCollectionSchema } from "./schemas";

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
