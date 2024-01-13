import { Metadata } from "next";
import { notFound } from "next/navigation";

import { findCollectionProducts, findProductByPublicId } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { PriceControls } from "@/components/product/controls/PriceControls";
import { VariantControls } from "@/components/product/controls/VariantControls";
import { ProductChart } from "@/components/product/ProductChart";
import { ProductInfoProvider } from "@/components/product/ProductInfoProvider";
import { DateRange, isDateRange } from "@/utils/dates";

type ProductPageProps = {
  params: { productId: string };
  searchParams: {
    range?: string;
  } & Record<string, string>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata | undefined> {
  const product = await findProductByPublicId({ productPublicId: params.productId });
  if (!product) {
    return undefined;
  }

  return {
    title: product.name,
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { range, ...attributesParams } = searchParams;

  const product = await findProductByPublicId({ productPublicId: params.productId });

  if (!product) {
    notFound();
  }

  const products = await findCollectionProducts({
    collectionId: product.collectionId,
  });

  const attributesOptions: Record<string, string[]> = {};
  products.forEach((product) => {
    product.variants.forEach(({ attributes }) => {
      attributes.forEach(({ name, value }) => {
        const values = attributesOptions[name] ?? [];
        if (!values.includes(value)) {
          values.push(value);
        }
        attributesOptions[name] = values;
      });
    });
  });

  const attributes: Record<string, string> = {};
  const hasParamsAttributes = Object.keys(attributesParams).length > 0;
  if (hasParamsAttributes) {
    Object.entries(attributesOptions).forEach(([name, values]) => {
      const paramsValue = attributesParams[name];
      if (paramsValue && values.includes(paramsValue)) {
        attributes[name] = paramsValue;
      }
    });
  } else {
    product.variants[0]?.attributes.forEach(({ name, value }) => {
      attributes[name] = value;
    });
  }

  const dateRange: DateRange = isDateRange(range) ? range : "3m";

  const mediaStorePath = getProductPath(product.publicId);
  const mediaUrl = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).toString();

  return (
    <ProductInfoProvider
      collectionPublicId={product.collection.publicId}
      productPublicId={product.publicId}
      productPublicIds={products.map((product) => product.publicId)}
      attributes={attributes}
      attributesOptions={attributesOptions}
      dateRange={dateRange}
    >
      <section className="space-y-12">
        <div className="container max-w-4xl">
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            <div className="h-64 min-w-[16rem]">
              <img
                className="h-full w-full object-contain"
                src={mediaUrl}
                alt={`Image of ${product.name}`}
              />
            </div>
            <div className="flex w-full flex-col gap-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">{product.collection.brand.name}</p>
                <h1 className="text-3xl font-medium">{product.name}</h1>
              </div>
              <VariantControls />
              <div className="flex flex-wrap gap-3">
                <PriceControls />
                <NotificationPopover />
              </div>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl">
          <ProductChart />
        </div>
      </section>
    </ProductInfoProvider>
  );
}
