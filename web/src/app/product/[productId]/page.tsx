import { PricesInfo } from "@/components/PricesInfo";
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
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold">{productsData[0].name}</h1>
      <a
        href={`https://www.uniqlo.com/us/en/products/${productsData[0].product_id}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 text-sky-600"
      >
        View item on Uniqlo
      </a>
      <PricesInfo productId={productsData[0].id} />
    </main>
  );
}
