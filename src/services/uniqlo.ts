import axios from "axios";
import { supabase } from "../lib/supabase";
import { dollarsToCents } from "../utils/currency";

const getPriceEndpoint = (productId: string) => {
  return `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/l2s?withPrices=true&withStocks=true&storeId=101539&httpFailure=true`;
};

type ItemData = {
  store_id: string;
  style: string;
  size: string;
  price_in_cents: number;
  in_stock: boolean;
  stock: number;
};

let _storeId: string;
const getStoreId = async () => {
  if (!_storeId) {
    const { data } = await supabase
      .from("stores")
      .select()
      .eq("name", "Uniqlo US");
    _storeId = data![0].id;
  }
  return _storeId;
};

//E449618-000
export const getItemData = async (url: string) => {
  // TODO: handle invalid urls
  const productId = url.match(/([a-zA-Z0-9]{7}-[0-9]{3})/g)![0];
  const priceEndpoint = getPriceEndpoint(productId);
  console.log(`Getting data for item ${productId}`);

  const {
    result: { stocks, prices, l2s },
  } = (await axios.get(priceEndpoint)).data;

  const storeId = await getStoreId();
  const itemData: ItemData[] = [];
  Object.keys(stocks).map((key, index) => {
    const style: string = l2s[index].color.displayCode.toString();
    const size: string = l2s[index].size.displayCode.toString();
    const stock: number = parseInt(stocks[key].quantity);
    const price: string = prices[key].base.value.toString();

    itemData.push({
      store_id: storeId,
      style,
      size,
      price_in_cents: dollarsToCents(price),
      in_stock: stock > 0,
      stock,
    });
  });

  return itemData;
};
