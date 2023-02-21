import axios from "axios";
import { dollarsToCents } from "../utils/currency";

const getPriceEndpoint = (productId: string) => {
  return `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/l2s?withPrices=true&withStocks=true&storeId=101539&httpFailure=true`;
};

type ItemData = {
  priceInCents: number;
  inStock: boolean;
  stock?: number;
};

type ItemDataMap = Map<string, Map<string, ItemData>>;

const addToDataMap = (
  map: ItemDataMap,
  style: string,
  size: string,
  itemData: ItemData
) => {
  if (!map.get(style)) {
    map.set(style, new Map());
  }

  map.get(style)!.set(size, itemData);
};

export const getItemData = async (url: string) => {
  // TODO: handle invalid urls
  const productId = url.match(/([a-zA-Z0-9]{7})-([0-9]{3})/g)![0];
  console.log(`Getting data for item ${productId}`);

  const priceEndpoint = getPriceEndpoint(productId);

  const {
    result: { stocks, prices, l2s },
  } = (await axios.get(priceEndpoint)).data;

  const itemMap: ItemDataMap = new Map();

  Object.keys(stocks).map((key, index) => {
    const style: string = l2s[index].color.displayCode.toString();
    const size: string = l2s[index].size.displayCode.toString();
    const stock: number = parseInt(stocks[key].quantity);
    const price: string = prices[key].base.value.toString();

    addToDataMap(itemMap, style, size, {
      priceInCents: dollarsToCents(price),
      inStock: stock > 0,
      stock,
    });
  });

  return itemMap;
};
