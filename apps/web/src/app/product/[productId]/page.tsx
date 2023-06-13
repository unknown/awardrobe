import { ProductInfo } from "@/components/ProductInfo";
import { prisma } from "@/utils/prisma";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      variant: {
        select: {
          optionType: true,
          value: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!product) {
    return "Product not found";
  }

  const groupedVariants = product.variant.reduce((accum, { optionType, value }) => {
    const group = accum[optionType] ?? [];
    group.push(value);
    accum[optionType] = group;
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
      <ProductInfo productId={product.id} variants={groupedVariants} />
    </div>
  );
}
