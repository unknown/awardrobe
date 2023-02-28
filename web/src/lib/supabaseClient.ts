import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function getProducts(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("id", productId);
  if (error) {
    console.error("products:", error);
    return null;
  }
  return data;
}

export type ProductsResponse = Awaited<ReturnType<typeof getProducts>>;

export async function getPrices(
  productId: number,
  style?: string,
  size?: string
) {
  let query = supabase
    .from("prices")
    .select()
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(6 * 24);
  if (size) query = query.eq("size", size);
  if (style) query = query.eq("style", style);

  const { data, error } = await query;
  if (error) {
    console.error("prices:", error);
    return null;
  }
  return data;
}

export type PricesResponse = Awaited<ReturnType<typeof getPrices>>;
