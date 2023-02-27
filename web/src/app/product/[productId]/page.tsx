import { PricesList } from "@/components/PricesList";
import { getProducts } from "@/lib/supabaseClient";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productsData = await getProducts(params.productId);

  if (!productsData || !productsData[0]) {
    return <div>Product not found</div>;
  }

  return (
    <main className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">{productsData[0].name}</h1>
      </div>
      <PricesList productId={productsData[0].id} />
    </main>
  );
}
