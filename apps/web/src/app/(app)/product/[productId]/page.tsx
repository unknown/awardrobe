import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  findCollectionProducts,
  findProductByPublicId,
  findProductVariantListings,
} from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { DateRangeControl } from "@/components/product/controls/DateRangeControls";
import { PriceControls } from "@/components/product/controls/PriceControls";
import { VariantControls } from "@/components/product/controls/VariantControls";
import { ProductChart } from "@/components/product/ProductChart";
import { ProductInfoProvider } from "@/components/product/ProductInfoProvider";
import { DateRange, getDateFromRange, isDateRange } from "@/utils/dates";

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

  const variants = products.flatMap((product) => product.variants);
  const attributesOptions: Record<string, string[]> = {};
  variants.forEach(({ attributes }) => {
    attributes.forEach(({ name, value }) => {
      const values = attributesOptions[name] ?? [];
      if (!values.includes(value)) {
        values.push(value);
      }
      attributesOptions[name] = values;
    });
  });

  const variant =
    (Object.keys(attributesParams).length > 0
      ? variants.find(({ attributes }) => {
          if (attributes.length !== Object.keys(attributesParams).length) {
            return false;
          }
          return attributes.every(({ name, value }) => attributesParams[name] === value);
        })
      : product.variants[0]) ?? null;

  if (variant && variant.productId !== product.id) {
    const newProduct = products.find((product) => product.id === variant.productId);
    if (newProduct) {
      const params = new URLSearchParams(searchParams);
      redirect(`/product/${newProduct.publicId}?${params.toString()}`);
    }
  }

  const dateRange: DateRange = isDateRange(range) ? range : "3m";

  const listings = variant
    ? await findProductVariantListings({
        productVariantId: variant.id,
        pricesStartDate: getDateFromRange(dateRange),
      })
    : [];

  const attributes: Record<string, string> = {};
  if (variant) {
    variant.attributes.forEach(({ name, value }) => {
      attributes[name] = value;
    });
  } else {
    Object.entries(attributesParams).forEach(([name, value]) => {
      if (attributesOptions[name]?.includes(value)) {
        attributes[name] = value;
      }
    });
  }

  const mediaStorePath = getProductPath(product.publicId);
  const mediaUrl = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).href;

  return (
    <ProductInfoProvider
      productPublicId={product.publicId}
      variants={variants}
      variantListings={listings}
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
              <VariantControls attributes={attributes} attributesOptions={attributesOptions} />
              <div className="flex flex-wrap gap-3">
                <PriceControls />
                <NotificationPopover
                  attributes={attributes}
                  attributesOptions={attributesOptions}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl space-y-3">
          <h2 className="text-xl font-medium">Price History</h2>
          <DateRangeControl dateRange={dateRange} />
          <div className="h-[20rem] sm:h-[24rem] md:h-[28rem]">
            <ProductChart />
          </div>
        </div>
      </section>
    </ProductInfoProvider>
  );
}
