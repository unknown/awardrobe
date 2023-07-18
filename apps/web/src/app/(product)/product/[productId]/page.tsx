import Link from "next/link";
import { Button } from "@ui/Button";
import { getServerSession } from "next-auth";

import { VariantAttribute } from "@awardrobe/adapters";
import { Prisma } from "@awardrobe/prisma-types";

import { ProductInfo } from "@/components/product/ProductInfo";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

const variantWithNotification = Prisma.validator<Prisma.ProductVariantArgs>()({
  include: { notifications: true },
});
export type VariantWithNotification = Prisma.ProductVariantGetPayload<
  typeof variantWithNotification
>;

const extendedProduct = Prisma.validator<Prisma.ProductArgs>()({
  include: { variants: variantWithNotification, store: true },
});
export type ExtendedProduct = Prisma.ProductGetPayload<typeof extendedProduct>;

type ProductPageProps = {
  params: { productId: string };
  searchParams: { variantId?: string };
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  const product: ExtendedProduct | null = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      variants: { include: { notifications: userId ? { where: { userId } } : { take: 0 } } },
      store: true,
    },
  });

  if (!product) {
    return (
      <section className="container max-w-4xl space-y-2">
        <h1 className="text-2xl font-medium">Product not found</h1>
        <p>The product you&apos;re looking couldn&apos;t be found</p>
        <div>
          <Link href="/">
            <Button>Go home</Button>
          </Link>
        </div>
      </section>
    );
  }

  const productOptions: Record<string, string[]> = {};
  product.variants.forEach((variant) => {
    const attributes = variant.attributes as VariantAttribute[];
    attributes.forEach(({ name, value }) => {
      const values = productOptions[name] ?? [];
      if (!values.includes(value)) values.push(value);
      productOptions[name] = values;
    });
  });

  const variant =
    (searchParams.variantId
      ? product.variants.find((variant) => variant.id === searchParams.variantId)
      : product.variants[0]) ?? null;

  const initialAttributes: Record<string, string> = {};
  if (variant) {
    const variantOptions = variant.attributes as VariantAttribute[];
    variantOptions.forEach(({ name, value }) => {
      initialAttributes[name] = value;
    });
  }

  return (
    <ProductInfo
      product={product}
      productOptions={productOptions}
      initialAttributes={initialAttributes}
      initialVariantId={variant?.id ?? null}
    />
  );
}
