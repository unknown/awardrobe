import { getProduct } from "@/utils/supabase-queries";
import { ProductInfo } from "./components/ProductInfo";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { data, error } = await getProduct(params.productId);

  if (!data) {
    return <main>Product not found</main>;
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col p-4">
      <div className="flex flex-row items-center justify-between"></div>
      <ProductInfo productData={data} />
    </main>
  );
}
