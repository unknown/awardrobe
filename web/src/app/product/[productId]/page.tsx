import { ProductHistory } from "@/components/ProductHistory";
import { getProduct } from "@/utils/supabase-queries";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { data, error } = await getProduct(params.productId);

  if (!data) {
    return "Product not found";
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl">{data.name}</h1>
        <a
          href={`https://www.uniqlo.com/us/en/products/${data.product_id}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600"
        >
          View item on Uniqlo
        </a>
      </div>
      <ProductHistory productId={data.id} />
    </div>
  );
}
