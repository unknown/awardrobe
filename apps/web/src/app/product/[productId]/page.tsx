import { ProductHistory } from "@/components/ProductHistory";
import { prisma } from "@/utils/prisma";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { variant: true },
  });

  if (!product) {
    return "Product not found";
  }

  const groupedVariants = product.variant.reduce((accum, { optionType, value }) => {
    if (accum[optionType] === undefined) {
      accum[optionType] = [];
    }
    accum[optionType].push(value);
    return accum;
  }, {} as Record<string, string[]>);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl">{product.name}</h1>
        <a
          href={`https://www.uniqlo.com/us/en/products/${product.productCode}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600"
        >
          View item on Uniqlo
        </a>
      </div>
      <ProductHistory productId={product.id} variants={groupedVariants} />
    </div>
  );
}
