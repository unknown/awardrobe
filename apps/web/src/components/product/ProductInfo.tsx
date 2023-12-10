"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { VariantAttribute } from "@awardrobe/adapters";
import { ProductWithVariants } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { formatCurrency } from "@/utils/utils";
import { DateRange, usePrices } from "../../hooks/usePrices";
import { ChartPrice, ProductChart } from "./ProductChart";
import { DateRangeControl, VariantControls } from "./ProductControls";

export type ProductInfoProps = {
  product: ProductWithVariants;
  productOptions: Record<string, string[]>;
  initialAttributes: Record<string, string>;
  initialVariantId: string | null;
};

export function ProductInfo({
  product,
  productOptions,
  initialAttributes,
  initialVariantId,
}: ProductInfoProps) {
  const { data: prices, fetchPrices, invalidateData: invalidatePrices, loading } = usePrices();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [attributes, setAttributes] = useState(initialAttributes);
  const [variantId, setVariantId] = useState(initialVariantId);
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const initialFetchOptions = useRef({ variantId, dateRange });
  const variant = product.variants.find((variant) => variant.id === variantId) ?? null;

  const loadPrices = useCallback(
    async (options: {
      variantId: string | null;
      dateRange: DateRange;
      abortSignal?: AbortSignal;
    }) => {
      if (!options.variantId) {
        invalidatePrices();
        return;
      }
      await fetchPrices({
        variantId: options.variantId,
        dateRange: options.dateRange,
        abortSignal: options.abortSignal,
      });
    },
    [fetchPrices, invalidatePrices],
  );

  useEffect(() => {
    const { variantId, dateRange } = initialFetchOptions.current;
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    loadPrices({ variantId, dateRange, abortSignal });

    return () => {
      abortController.abort();
    };
  }, [loadPrices]);

  const lastPrice = prices?.at(-1);
  const chartPrices: ChartPrice[] | null =
    prices !== null && lastPrice
      ? [...prices, { ...lastPrice, timestamp: new Date().toISOString() }].map((price) => ({
          date: price.timestamp.toString(),
          price: price.priceInCents,
          stock: price.inStock ? 1 : 0,
        }))
      : null;

  const getPillText = () => {
    switch (true) {
      case !variant?.productUrl:
        return "Not available";
      case prices === null:
        return "Loading...";
      case lastPrice === undefined:
        return "See price";
      default:
        return `${formatCurrency(lastPrice.priceInCents)} on ${
          product.store.shortenedName ?? product.store.name
        }`;
    }
  };

  const mediaStorePath = getProductPath(product.id);
  const url = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).href;

  return (
    <section className="space-y-12">
      <div className="container max-w-4xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="h-64 min-w-[16rem]">
            <img className="h-full w-full object-contain" src={url} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">{product.store.name}</p>
            <h1 className="text-3xl font-medium">{product.name}</h1>
            <div className="grid grid-cols-[max-content_1fr] flex-wrap items-center gap-3 md:flex">
              <VariantControls
                attributes={attributes}
                productOptions={productOptions}
                onAttributeChange={(name, value) => {
                  const newAttributes = { ...attributes, [name]: value };
                  setAttributes(newAttributes);

                  const variant = product.variants.find((variant) => {
                    const variantAttributes = variant.attributes as VariantAttribute[];
                    if (variantAttributes.length !== Object.keys(newAttributes).length)
                      return false;
                    return variantAttributes.every(
                      (attribute) => newAttributes[attribute.name] === attribute.value,
                    );
                  });
                  const variantId = variant?.id ?? null;
                  setVariantId(variantId);

                  loadPrices({ variantId, dateRange });

                  const params = new URLSearchParams(Object.fromEntries(searchParams.entries()));
                  params.set("variantId", variantId ?? "null");
                  router.replace(`${pathname}?${params.toString()}`); // TODO: shallow replace
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="text-md inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600"
                href={variant?.productUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {getPillText()}
              </a>
              <NotificationPopover
                productId={product.id}
                productOptions={productOptions}
                variants={product.variants}
                attributes={attributes}
                priceInCents={lastPrice?.priceInCents ?? null}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="container max-w-4xl space-y-2">
        <h2 className="text-xl font-medium">Price History</h2>
        <div className="flex flex-wrap justify-between gap-4 pb-2">
          <DateRangeControl
            dateRange={dateRange}
            onDateRangeChange={(dateRange) => {
              loadPrices({ variantId, dateRange });
              setDateRange(dateRange);
            }}
          />
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
          {prices === null || loading ? (
            <ChartOverlay type="loading" />
          ) : prices.length === 0 ? (
            <ChartOverlay type="no-prices" />
          ) : null}
          <ProductChart prices={chartPrices} />
        </div>
      </div>
    </section>
  );
}

type ChartOverlayProps = {
  type: "loading" | "no-prices";
};
function ChartOverlay({ type }: ChartOverlayProps) {
  function getContent() {
    switch (type) {
      case "loading":
        return <p className="text-muted-foreground">Loading...</p>;
      case "no-prices":
        return (
          <div className="bg-gradient-radial from-background to-transparent p-16 text-center">
            <h2 className="text-xl font-medium">No price history</h2>
            <p className="text-muted-foreground">
              Hang tight, we&apos;ll fetch the prices for you soon.
            </p>
          </div>
        );
    }
  }

  return (
    <div className="absolute z-10 flex h-full w-full items-center justify-center">
      {getContent()}
    </div>
  );
}
