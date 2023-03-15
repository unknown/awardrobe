import { supabase } from "@/lib/supabase-client";

export async function getProduct(
  productId: string,
  options: {
    abortSignal?: AbortSignal;
  } = {}
) {
  const { abortSignal } = options;

  let query = supabase.from("products").select().eq("id", productId);
  if (abortSignal) query.abortSignal(abortSignal);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("products:", error);
    return null;
  }
  return data;
}

export type ProductResponse = Awaited<ReturnType<typeof getProduct>>;

export async function getPrices(
  productId: number,
  options: {
    startDate?: Date;
    style?: string;
    size?: string;
    abortSignal?: AbortSignal;
  } = {}
) {
  const { startDate, style, size, abortSignal } = options;

  let query = supabase
    .from("prices")
    .select()
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (startDate) query = query.gt("created_at", startDate.toISOString());
  if (size) query = query.eq("size", size);
  if (style) query = query.eq("style", style);
  if (abortSignal) query.abortSignal(abortSignal);

  const { data, error } = await query;
  if (error) {
    console.error("prices:", error);
    return null;
  }
  return data;
}

export type PricesResponse = Awaited<ReturnType<typeof getPrices>>;
