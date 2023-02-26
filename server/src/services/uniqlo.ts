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
  const { data } = await supabase
    .from("products")
    .select()
    .eq("product_id", productId);

  return data![0].id;
}

export async function getItemData(productId: string) {
  const priceEndpoint = getPriceEndpoint(productId);

  const {
    result: { stocks, prices, l2s },
  } = (await axios.get(priceEndpoint)).data;

  const itemData: ItemData[] = [];
  await Promise.all(
    Object.keys(stocks).map(async (key, index) => {
      const style: string = l2s[index].color.displayCode.toString();
      const size: string = l2s[index].size.displayCode.toString();
      const stock: number = parseInt(stocks[key].quantity);
      const price: string = prices[key].base.value.toString();

      const productDbId = await getProductDbId(productId);

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
