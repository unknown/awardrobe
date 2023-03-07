import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function getProduct(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("id", productId)
    .maybeSingle();
  if (error) {
    console.error("products:", error);
    return null;
  }
  return data;
}

export type ProductResponse = Awaited<ReturnType<typeof getProduct>>;

export const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
export type DateRange = (typeof DateRanges)[number];
const dateOffsets = {
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
  Month: 31 * 24 * 60 * 60 * 1000,
};

export async function getPrices(
  productId: number,
  dateRange: DateRange,
  style?: string,
  size?: string
) {
  let startDate: Date | null = new Date();
  if (dateRange === "All Time") {
    startDate = null;
  } else {
    startDate.setTime(startDate.getTime() - dateOffsets[dateRange]);
  }

  let query = supabase
    .from("prices")
    .select()
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (startDate) query = query.gt("created_at", startDate.toISOString());
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
