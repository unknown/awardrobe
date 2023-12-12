import { notFound } from "next/navigation";

import { VariantAttribute } from "@awardrobe/adapters";
import { findPrices, findProductWithVariants } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { ChartPrice, ProductChart } from "@/components/product/ProductChart";
import { DateRangeControl, VariantControls } from "@/components/product/ProductControls";
import { DateRange, getDateFromRange } from "@/utils/dates";
import { formatCurrency } from "@/utils/utils";

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
  const product = await findProductWithVariants(params.productId);

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
    Object.keys(attributesParams).length > 0
      ? product.variants.find((variant) => {
          const attributes = variant.attributes as VariantAttribute[];
          if (attributes.length !== Object.keys(attributesParams).length) {
            return false;
          }
          return attributes.every(({ name, value }) => attributesParams[name] === value);
        })
      : product.variants[0];

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

  const mediaStorePath = getProductPath(product.id);
  const mediaUrl = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).href;

  const prices = variant
    ? await findPrices({
        variantId: variant.id,
        startDate: getDateFromRange(initialDateRange).toISOString(),
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

  return (
    <section className="space-y-12">
      <div className="container max-w-4xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="h-64 min-w-[16rem]">
            <img className="h-full w-full object-contain" src={mediaUrl} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">{product.store.name}</p>
            <h1 className="text-3xl font-medium">{product.name}</h1>
            <VariantControls
              initialAttributes={initialAttributes}
              productOptions={productOptions}
            />
            <div className="flex flex-wrap gap-3">
              <a
                className="text-md inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600"
                href={variant?.productUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {!variant?.productUrl
                  ? "Not available"
                  : lastPrice === undefined
                    ? "See price"
                    : `${formatCurrency(lastPrice.priceInCents)} on ${
                        product.store.shortenedName ?? product.store.name
                      }`}
              </a>
              <NotificationPopover
                productId={product.id}
                productOptions={productOptions}
                variants={product.variants}
                attributes={initialAttributes}
                priceInCents={lastPrice?.priceInCents ?? null}
              />
            </div>
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
        {prices?.length === 1000 ? (
          <div className="rounded-md border border-yellow-300 bg-yellow-100 p-4 text-yellow-900">
            Limited to showing only the first 1000 data points. Try applying filters to decrease the
            number of data points.
          </div>
        ) : null}
        <div className="relative h-[20rem] sm:h-[24rem] md:h-[28rem]">
          <ProductChart prices={chartPrices} />
        </div>
      </div>
    </section>
  );
}
