import { getProduct } from "@/utils/supabase-queries";
import { ProductInfo } from "./components/ProductInfo";

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
      <ProductInfo productData={productData} />
    </main>
  );
}
