import { notFound } from "next/navigation";

import { findFullProductPublic, findPublicPrices } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";

import { DateRangeControl } from "@/components/product/controls/DateRangeControls";
import { PriceControls } from "@/components/product/controls/PriceControls";
import { VariantControls } from "@/components/product/controls/VariantControls";
import { ChartPrice, ProductChart } from "@/components/product/ProductChart";
import { ProductInfoProvider } from "@/components/product/ProductInfoProvider";
import { getDateFromRange, isDateRange } from "@/utils/dates";

type ProductPageProps = {
  params: { productId: string };
  searchParams: {
    range?: string;
  } & Record<string, string>;
};

export default async function ProductPage({
  params,
  searchParams: { range, ...attributesParams },
}: ProductPageProps) {
  const product = await findFullProductPublic({ productPublicId: params.productId });

  if (!product) {
    notFound();
  }

  const productOptions: Record<string, string[]> = {};
  product.variants.forEach(({ attributes }) => {
    attributes.forEach(({ name, value }) => {
      const values = productOptions[name] ?? [];
      if (!values.includes(value)) {
        values.push(value);
      }
      productOptions[name] = values;
    });
  });

  const variant =
    (Object.keys(attributesParams).length > 0
      ? product.variants.find(({ attributes }) => {
          if (attributes.length !== Object.keys(attributesParams).length) {
            return false;
          }
          return attributes.every(({ name, value }) => attributesParams[name] === value);
        })
      : product.variants[0]) ?? null;

  const initialDateRange = isDateRange(range) ? range : "7d";
  const initialAttributes: Record<string, string> = {};
  if (variant) {
    variant.attributes.forEach(({ name, value }) => {
      initialAttributes[name] = value;
    });
  } else {
    Object.entries(attributesParams).forEach(([name, value]) => {
      if (productOptions[name]?.includes(value)) {
        initialAttributes[name] = value;
      }
    });
  }

  const prices = variant
    ? await findPublicPrices({
        variantPublicId: variant.publicId,
        startDate: getDateFromRange(initialDateRange),
      })
    : null;
  const lastPrice = prices?.at(-1);
  const chartPrices: ChartPrice[] | null =
    prices !== null && lastPrice
      ? [...prices, { ...lastPrice, timestamp: new Date().toISOString() }].map((price) => ({
          date: price.timestamp.toString(),
          price: price.priceInCents,
          stock: price.inStock ? 1 : 0,
        }))
      : null;

  const mediaStorePath = getProductPath(product.publicId);
  const mediaUrl = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).href;

  return (
    <ProductInfoProvider
      product={product}
      productOptions={productOptions}
      variant={variant}
      attributes={initialAttributes}
      prices={prices}
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
            <div className="flex w-full flex-col gap-2">
              <p className="text-muted-foreground text-sm">{product.store.name}</p>
              <h1 className="text-3xl font-medium">{product.name}</h1>
              <VariantControls />
              <PriceControls />
            </div>
          </div>
        </div>
        <div className="container max-w-4xl space-y-2">
          <h2 className="text-xl font-medium">Price History</h2>
          <div className="flex flex-wrap justify-between gap-4 pb-2">
            <DateRangeControl initialDateRange={initialDateRange} />
            <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 border border-[#398739] bg-[#A8FF99]/[0.3]" /> In Stock
              </span>
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#2b8bad]" /> {product.store.name}
              </span>
            </div>
          </div>
          <ProductChart prices={chartPrices} />
        </div>
      </section>
    </ProductInfoProvider>
  );
}
