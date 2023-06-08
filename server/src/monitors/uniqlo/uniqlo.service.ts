import { dollarsToCents } from "@/utils/currency";
import { toTitleCase } from "@/utils/formatter";
import { getProductId, getStoreId, supabase } from "@/utils/supabase";
import { PricesEntry, ProductsEntry } from "@/utils/types";
import {
  AddProductRequest,
  AddProductResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  UniqloType,
} from "./uniqlo.types";

export async function handleHeartbeat({ productId }: HeartbeatRequest): Promise<HeartbeatResponse> {
  // TODO: simplify this logic so that storeId only needs to be retrieved once
  const storeId = await getStoreId("Uniqlo US");
  if (!storeId) {
    return {
      status: "error",
      error: "Uniqlo US missing from stores table",
    };
  }

  const dbProductId = await getProductId(storeId, productId);
  if (!dbProductId) {
    return {
      status: "error",
      error: "Product missing from products table",
    };
  }

  const [prices, { colors, sizes }] = await Promise.all([
    getPrices(productId),
    getDetails(productId),
  ]);
  if (prices.length === 0) {
    console.warn(`Product ${productId} has empty data`);
  }

  const entries: PricesEntry[] = prices.map(({ color, size, priceInCents, stock }) => ({
    product_id: dbProductId,
    style: colors[color],
    size: sizes[size],
    price_in_cents: priceInCents,
    stock,
    in_stock: stock > 0,
  }));

  const { error } = await supabase.from("prices").insert(entries);
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

export async function addProduct({ productId }: AddProductRequest): Promise<AddProductResponse> {
  const storeId = await getStoreId("Uniqlo US");
  if (!storeId) {
    return {
      status: "error",
      error: "Uniqlo US missing from stores table",
    };
  }

  const dbProductId = await getProductId(storeId, productId);
  if (dbProductId !== null) {
    return {
      status: "error",
      error: "Product already in products table",
    };
  }

  const { name, colors, sizes } = await getDetails(productId);

  const entry: ProductsEntry = {
    product_id: productId,
    name: name,
    store_id: storeId,
    styles: Object.values(colors),
    sizes: Object.values(sizes),
  };

  const { error } = await supabase.from("products").insert(entry);
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

async function getPrices(productId: string) {
  const pricesResponse = await fetchPricesData(productId);
  const { stocks, prices: pricesObject, l2s } = (await pricesResponse.json()).result;

  const prices: { color: string; size: string; priceInCents: number; stock: number }[] = [];
  Object.keys(stocks).forEach((key, index) => {
    prices.push({
      color: l2s[index].color.displayCode.toString(),
      size: l2s[index].size.displayCode.toString(),
      priceInCents: dollarsToCents(pricesObject[key].base.value.toString()),
      stock: parseInt(stocks[key].quantity),
    });
  });
  return prices;
}

async function getDetails(productId: string) {
  const detailsResponse = await fetchDetailsData(productId);
  const { name, colors, sizes } = (await detailsResponse.json()).result;

  const colorsRecord: Record<string, string> = {};
  colors.forEach((color: UniqloType) => {
    colorsRecord[color.displayCode] = toTitleCase(color.name);
  });
  const sizesRecord: Record<string, string> = {};
  sizes.forEach((size: UniqloType) => {
    sizesRecord[size.displayCode] = size.name;
  });

  return { name, colors: colorsRecord, sizes: sizesRecord };
}

function fetchPricesData(productId: string) {
  const pricesEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  return fetch(pricesEndpoint);
}

function fetchDetailsData(productId: string) {
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productId}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  return fetch(detailsEndpoint);
}
