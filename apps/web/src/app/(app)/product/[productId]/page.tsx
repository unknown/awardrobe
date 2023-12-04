import { notFound } from "next/navigation";

import { VariantAttribute } from "@awardrobe/adapters";
import { findProductWithVariants } from "@awardrobe/db";

import { ProductInfo } from "@/components/product/ProductInfo";

type ProductPageProps = {
  params: { productId: string };
  searchParams: { variantId?: string };
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const product = await findProductWithVariants(params.productId);

  if (!product) {
    notFound();
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
