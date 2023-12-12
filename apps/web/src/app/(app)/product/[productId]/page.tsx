import { Fragment, Suspense } from "react";
import { notFound } from "next/navigation";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";

import { VariantAttribute } from "@awardrobe/adapters";
import { findPrices, findProductWithVariants, ProductWithVariants } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";
import { Price, ProductVariant } from "@awardrobe/prisma-types";

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

  const pricesPromise = variant
    ? findPrices({
        variantId: variant.id,
        startDate: getDateFromRange(initialDateRange).toISOString(),
      })
    : null;

  const mediaStorePath = getProductPath(product.id);
  const mediaUrl = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).href;

  const suspenseKey = `${variant?.id}-${initialDateRange}`;

  return (
    <section className="space-y-12">
      <div className="container max-w-4xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="h-64 min-w-[16rem]">
            <img className="h-full w-full object-contain" src={mediaUrl} />
          </div>
          <div className="flex w-full flex-col gap-2">
            <p className="text-muted-foreground text-sm">{product.store.name}</p>
            <h1 className="text-3xl font-medium">{product.name}</h1>
            <VariantControls
              initialAttributes={initialAttributes}
              productOptions={productOptions}
            />
            <div className="flex flex-wrap gap-3">
              <Suspense
                key={suspenseKey}
                fallback={
                  <Fragment>
                    <p className="text-md rounded-md bg-sky-500 px-4 py-2 font-medium text-white">
                      Loading...
                    </p>
                    <Button variant="secondary" size="icon" disabled>
                      <Bell />
                    </Button>
                  </Fragment>
                }
              >
                <PriceControls
                  pricesPromise={pricesPromise}
                  product={product}
                  variant={variant ?? null}
                  productOptions={productOptions}
                  initialAttributes={initialAttributes}
                />
              </Suspense>
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
        <div className="relative h-[20rem] sm:h-[24rem] md:h-[28rem]">
          <Suspense
            key={suspenseKey}
            fallback={
              <Fragment>
                <ProductChart prices={null} />
                <p className="text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  Loading...
                </p>
              </Fragment>
            }
          >
            <Chart pricesPromise={pricesPromise} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

type PriceControlsProps = {
  pricesPromise: Promise<Price[]> | null;
  product: ProductWithVariants;
  variant: ProductVariant | null;
  productOptions: Record<string, string[]>;
  initialAttributes: Record<string, string>;
};

async function PriceControls({
  pricesPromise,
  product,
  variant,
  productOptions,
  initialAttributes,
}: PriceControlsProps) {
  const prices = await pricesPromise;
  const lastPrice = prices?.at(-1);

  const storeName = product.store.shortenedName ?? product.store.name;

  return (
    <Fragment>
      <a
        className="text-md inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600"
        href={variant?.productUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {!variant?.productUrl
          ? "Not available"
          : !lastPrice
            ? "See price"
            : `${formatCurrency(lastPrice.priceInCents)} at ${storeName}`}
      </a>
      <NotificationPopover
        productId={product.id}
        productOptions={productOptions}
        variants={product.variants}
        attributes={initialAttributes}
        priceInCents={lastPrice?.priceInCents ?? null}
      />
    </Fragment>
  );
}

type ChartProps = {
  pricesPromise: Promise<Price[]> | null;
};

async function Chart({ pricesPromise }: ChartProps) {
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

  return (
    <Fragment>
      <ProductChart prices={chartPrices} />
      {chartPrices === null && (
        <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
          <h2 className="text-xl font-medium">No price history</h2>
          <p className="text-muted-foreground">
            We have no data in this date range. Maybe try again later?
          </p>
        </div>
      )}
    </Fragment>
  );
}
