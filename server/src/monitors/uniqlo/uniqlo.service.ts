import { dollarsToCents } from "../../utils/currency";
import { supabase } from "../../utils/supabase";
import { ItemData } from "../../utils/types";
import { HeartbeatRequest, HeartbeatResponse } from "./uniqlo.types";

export async function handleHeartbeat({
  productId,
}: HeartbeatRequest): Promise<HeartbeatResponse> {
  const dbProductId = await getProductId(productId);
  if (!dbProductId) {
    console.error(`Product ${productId} not found in products table`);
    return {
      status: "error",
      error: "Product not found in products table",
    };
  }

  const itemData = await getProductData(productId, dbProductId);
  if (itemData.length === 0) {
    console.warn(`Product ${productId} has empty data`);
  }

  const { error } = await supabase.from("prices").insert(itemData);
  if (error) {
    console.error(error);
  }

  return {
    status: "success",
  };
}

// TODO: extract this to its own util file?
let _storeId: number;
async function getStoreId() {
  if (!_storeId) {
    const { data } = await supabase
      .from("stores")
      .select()
      .eq("name", "Uniqlo US")
      .single();
    if (!data) {
      console.error("Could not find Uniqlo US store");
      return null;
    }
    _storeId = data.id;
  }
  return _storeId;
}

// TODO: cache product ids to save on DB reads and error handling
async function getProductId(productId: string) {
  const storeId = await getStoreId();
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data?.id;
}

async function getProductData(productId: string, dbProductId: number) {
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
