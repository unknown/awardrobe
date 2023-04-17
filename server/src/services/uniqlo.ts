import { dollarsToCents } from "../utils/currency";

type ItemData = {
  style: string;
  size: string;
  price_in_cents: number;
  stock: number;
  in_stock: boolean;
};

export async function getProductData(productId: string) {
  const priceEndpoint = getPriceEndpoint(productId);
  const itemData: ItemData[] = [];

  const response = await fetch(priceEndpoint);
  const {
    result: { stocks, prices, l2s },
  } = await response.json();

  Object.keys(stocks).forEach((key, index) => {
    const style = l2s[index].color.displayCode.toString();
    const size = l2s[index].size.displayCode.toString();
    const stock = parseInt(stocks[key].quantity);
    const price = prices[key].base.value.toString();

    itemData.push({
      style,
      size,
      price_in_cents: dollarsToCents(price),
      stock,
      in_stock: stock > 0,
    });
  });

  return itemData;
}

function getPriceEndpoint(productId: string) {
  return `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
}
