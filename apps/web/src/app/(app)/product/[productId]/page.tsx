import { notFound } from "next/navigation";

import { VariantAttribute } from "@awardrobe/adapters";
import { findPrices, findProductWithVariants } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";

import { DateRangeControl } from "@/components/product/controls/DateRangeControls";
import { PriceControls } from "@/components/product/controls/PriceControls";
import { VariantControls } from "@/components/product/controls/VariantControls";
import { ChartPrice, ProductChart } from "@/components/product/ProductChart";
import { ProductInfoProvider } from "@/components/product/ProductInfoProvider";
import { DateRange, getDateFromRange } from "@/utils/dates";

type ProductPageProps = {
  params: { productId: string };
  searchParams: {
    range?: DateRange;
  } & Record<string, string>;
};

export default async function ProductPage({
  params,
  searchParams: { range, ...attributesParams },
}: ProductPageProps) {
  const productId = Number(params.productId);
  const product = await findProductWithVariants({ productId });

  if (!product) {
    notFound();
  }

  const productOptions: Record<string, string[]> = {};
  product.variants.forEach((variant) => {
    const attributes = variant.attributes as VariantAttribute[];
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
      ? product.variants.find((variant) => {
          const attributes = variant.attributes as VariantAttribute[];
          if (attributes.length !== Object.keys(attributesParams).length) {
            return false;
          }
          return attributes.every(({ name, value }) => attributesParams[name] === value);
        })
      : product.variants[0]) ?? null;

  const initialDateRange = range ?? "7d";
  const initialAttributes: Record<string, string> = {};
  if (variant) {
    const attributes = variant.attributes as VariantAttribute[];
    attributes.forEach(({ name, value }) => {
      initialAttributes[name] = value;
    });
  } else {
    Object.entries(attributesParams).forEach(([name, value]) => {
      if (productOptions[name]?.includes(value)) {
        initialAttributes[name] = value;
      }
    });
  }

  const pricesPromise = variant
    ? findPrices({
        variantId: variant.id,
        startDate: getDateFromRange(initialDateRange),
      })
    : null;

  const prices = await pricesPromise;
  const lastPrice = prices?.at(-1);
  const chartPrices: ChartPrice[] | null =
    prices !== null && lastPrice
      ? [...prices, { ...lastPrice, timestamp: new Date().toISOString() }].map((price) => ({
          date: price.timestamp.toString(),
          price: price.priceInCents,
          stock: price.inStock ? 1 : 0,
        }))
      : null;

  const mediaStorePath = getProductPath(product.id.toString());
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
