import axios from "axios";
import { dollarsToCents } from "../utils/currency";

type ItemData = {
  style: string;
  size: string;
  price_in_cents: number;
  stock: number;
  in_stock: boolean;
};

function getPriceEndpoint(productId: string) {
  return `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
}

export async function getProductData(productId: string) {
  const priceEndpoint = getPriceEndpoint(productId);
  const itemData: ItemData[] = [];

  const {
    result: { stocks, prices, l2s },
  } = (await axios.get(priceEndpoint)).data;

  await Promise.all(
    Object.keys(stocks).map(async (key, index) => {
      const style: string = l2s[index].color.displayCode.toString();
      const size: string = l2s[index].size.displayCode.toString();
      const stock: number = parseInt(stocks[key].quantity);
      const price: string = prices[key].base.value.toString();

      itemData.push({
        style,
        size,
        price_in_cents: dollarsToCents(price),
        stock,
        in_stock: stock > 0,
      });
    })
  );

  return itemData;
}
