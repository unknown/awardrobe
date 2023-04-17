import { dollarsToCents } from "../../utils/currency";
import { getProductId, supabase } from "../../utils/supabase";
import { PriceData } from "../../utils/types";
import { HeartbeatRequest, HeartbeatResponse } from "./uniqlo.types";

export async function handleHeartbeat({
  productId,
}: HeartbeatRequest): Promise<HeartbeatResponse> {
  const dbProductId = await getProductId("Uniqlo US", productId);
  if (!dbProductId) {
    return {
      status: "error",
      error: "Product missing from products table",
    };
  }

  const itemData = await getProductData(productId, dbProductId);
  if (itemData.length === 0) {
    console.warn(`Product ${productId} has empty data`);
  }

  const { error } = await supabase.from("prices").insert(itemData);
  if (error) {
    return {
      status: "error",
      error: error.message,
    };
  }

  return {
    status: "success",
  };
}

async function getProductData(productId: string, dbProductId: number) {
  const priceEndpoint = getPriceEndpoint(productId);
  const itemData: PriceData[] = [];

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
      product_id: dbProductId,
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
