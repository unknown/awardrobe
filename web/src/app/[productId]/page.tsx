import { PricesList } from "@/components/PricesList";
import { supabase } from "@/lib/supabaseClient";

interface ProductPageProps {
  params: { productId: string; style?: string; size?: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const products = await supabase
    .from("products")
    .select()
    .eq("id", params.productId);

  if (!products.data || products.data.length === 0) {
    return <div>Product does not exist</div>;
  }

  let query = supabase
    .from("prices")
    .select()
    .eq("product_id", params.productId)
    .order("created_at", { ascending: false })
    .limit(6 * 12);
  if (params.size) query = query.eq("size", params.size);
  if (params.style) query = query.eq("style", params.style);

  const { data } = await query;

  return (
    <main className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">{products.data[0].name}</h1>
        {params.productId} {params.style} {params.size}
      </div>
      <PricesList data={data} />
    </main>
  );
}
