import { dollarsToCents, toTitleCase } from "../utils/formatter";
import { ProductPrice } from "../utils/types";
import { detailsSchema, l2sSchema, productsSchema } from "./schemas";

const colorsStylizer = (color: { code: string; name: string; displayCode: string }) => {
  return {
    ...color,
    stylizedName: toTitleCase(`${color.displayCode} ${color.name}`),
  };
};
const sizeStylizer = (size: { code: string; name: string; displayCode: string }) => {
  return {
    ...size,
    stylizedName: size.name,
  };
};

export async function getProducts(offset: number = 0, limit: number = 36) {
  const productsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products?offset=${offset}&limit=${limit}&httpFailure=true`;
  const productsResponse = await fetch(productsEndpoint);
  const { items, pagination } = productsSchema.parse(await productsResponse.json()).result;

  const products = items.map((item) => {
    const styles = item.colors.map((color) => colorsStylizer(color));
    const sizes = item.sizes.map((size) => sizeStylizer(size));
    return {
      name: item.name,
      productCode: item.productId,
      styles,
      sizes,
    };
  });

  return {
    products,
    pagination,
  };
}

export async function getProductDetails(productCode: string) {
  const l2sEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const [l2sResponse, detailsResonse] = await Promise.all([
    fetch(l2sEndpoint),
    fetch(detailsEndpoint),
  ]);

  const { stocks, prices, l2s } = l2sSchema.parse(await l2sResponse.json()).result;
  const detailsResult = detailsSchema.parse(await detailsResonse.json()).result;

  const styles = detailsResult.colors.map((color) => colorsStylizer(color));
  const sizes = detailsResult.sizes.map((size) => sizeStylizer(size));

  const productPrices: ProductPrice[] = [];

  l2s.forEach(({ color, size, l2Id }) => {
    const stocksEntry = stocks[l2Id];
    const pricesEntry = prices[l2Id];

    if (!pricesEntry || !stocksEntry) {
      return;
    }

    const colorName = styles.find((s) => s.code === color.code);
    const sizeName = sizes.find((s) => s.code === size.code);
    const priceInCents = dollarsToCents(pricesEntry.base.value.toString());
    const stock = stocksEntry.quantity;

    if (!colorName || !sizeName) throw new Error("Failed to parse product details");

    productPrices.push({
      style: colorName.stylizedName,
      size: sizeName.stylizedName,
      priceInCents,
      stock,
    });
  });

  return {
    name: detailsResult.name,
    styles,
    sizes,
    prices: productPrices,
  };
}
