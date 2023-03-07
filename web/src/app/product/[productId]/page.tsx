import { PricesInfo } from "@/components/PricesInfo";
import { getProduct } from "@/lib/supabaseClient";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productData = await getProduct(params.productId);

  if (!productData) {
    return <main>Product not found</main>;
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col p-4">
      <div className="flex flex-row items-center justify-between"></div>
      <PricesInfo productData={productData} />
    </main>
  );
}
