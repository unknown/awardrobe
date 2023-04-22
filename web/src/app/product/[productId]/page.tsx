import { getProduct } from "@/utils/supabase-queries";
import { ProductInfo } from "../../../components/ProductInfo";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { data, error } = await getProduct(params.productId);

  if (!data) {
    return "Product not found";
  }

  return <ProductInfo productData={data} />;
}
