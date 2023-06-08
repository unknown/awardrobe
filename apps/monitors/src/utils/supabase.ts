import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const productIdCache = new Map<string, number>();
const storeIdCache = new Map<string, number>();

export async function getProductId(storeId: number, externalProductId: string) {
  const joinedKey = `${storeId}:${externalProductId}`;

  const cachedId = productIdCache.get(joinedKey);
  if (cachedId) {
    return cachedId;
  }

  const { data } = await supabase
    .from("products")
    .select()
    .eq("store_id", storeId)
    .eq("product_id", externalProductId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  productIdCache.set(joinedKey, data.id);
  return data.id;
}

export async function getStoreId(storeName: string) {
  const cachedId = storeIdCache.get(storeName);
  if (cachedId) {
    return cachedId;
  }

  const { data } = await supabase.from("stores").select().eq("name", storeName).single();

  if (!data) {
    return null;
  }

  storeIdCache.set(storeName, data.id);
  return data.id;
}
