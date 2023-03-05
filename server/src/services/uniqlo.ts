import axios from "axios";
import { supabase } from "../lib/supabase";
import { dollarsToCents } from "../utils/currency";

type ItemData = {
  product_id: number;
  style: string;
  size: string;
  price_in_cents: number;
  stock: number;
  in_stock: boolean;
};

function getPriceEndpoint(productId: string) {
  return `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
}

// TODO: cache product ids to save on DB reads and error handling
async function getProductDbId(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data?.id;
}

export async function getItemData(productId: string) {
  const priceEndpoint = getPriceEndpoint(productId);
  const itemData: ItemData[] = [];

  const productDbId = await getProductDbId(productId);
  if (!productDbId) return itemData;

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
        product_id: productDbId,
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
