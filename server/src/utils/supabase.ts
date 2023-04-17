import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const productIdCache = new Map<string, number>();

export async function getProductId(storeName: string, productId: string) {
  const joinedKey = `${storeName}:${productId}`;

  const cachedId = productIdCache.get(joinedKey);
  if (cachedId) {
    return cachedId;
  }

  const storeId = await getStoreId(storeName);
  const { data } = await supabase
    .from("products")
    .select()
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  productIdCache.set(joinedKey, data.id);
  return data.id;
}

async function getStoreId(storeName: string) {
  const { data } = await supabase
    .from("stores")
    .select()
    .eq("name", storeName)
    .single();

  return data?.id;
}
