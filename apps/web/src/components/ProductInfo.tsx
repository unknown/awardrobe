"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/Button";

import { VariantAttribute } from "@awardrobe/adapters";

import { ExtendedProduct } from "@/app/(product)/product/[productId]/page";
import { AddNotificationResponse } from "@/app/api/notifications/create/route";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { formatCurrency } from "@/utils/utils";
import { DateRange, usePrices } from "../hooks/usePrices";
import { AddNotificationDialog } from "./AddNotificationDialog";
import { ProductChart } from "./ProductChart";
import { DateRangeControl, VariantControls } from "./ProductControls";

type ControlOptions = {
  variantIndex: number;
  attributes: Record<string, string>;
  dateRange: DateRange;
};

export type ProductInfoProps = {
  product: ExtendedProduct;
  productOptions: Record<string, string[]>;
  initialOptions: ControlOptions;
};

export function ProductInfo({ product, productOptions, initialOptions }: ProductInfoProps) {
  const router = useRouter();
  const { data: prices, fetchPrices, invalidateData } = usePrices();

  const [options, setOptions] = useState<ControlOptions>(initialOptions);

  const loadPrices = useCallback(
    async (options: { variantIndex: number; dateRange: DateRange; abortSignal?: AbortSignal }) => {
      const variant = product.variants[options.variantIndex];
      if (!variant) {
        invalidateData();
        return;
      }
      await fetchPrices({
        variantId: variant.id,
        dateRange: options.dateRange,
        abortSignal: options.abortSignal,
      });
    },
    [fetchPrices, invalidateData],
  );

  useEffect(() => {
    const abortController = new AbortController();
    loadPrices({ ...initialOptions, abortSignal: abortController.signal });
    return () => {
      abortController.abort();
    };
  }, [initialOptions, loadPrices]);

  const variant = product.variants[options.variantIndex];

  const getPillText = () => {
    const lastPrice = prices?.at(-1)?.priceInCents;
    if (prices === null) {
      return "Loading...";
    } else if (lastPrice === undefined) {
      return "See price";
    } else {
      return `${formatCurrency(lastPrice)} on ${product.store.shortenedName ?? product.store.name}`;
    }
  };

  const NotificationButton = () => {
    if (!variant) return null;

    const notification = variant.notifications[0];
    if (notification) {
      return (
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await deleteNotification(notification.id);
            if (result.status === "success") {
              router.refresh();
            }
          }}
        >
          Delete notification
        </Button>
      );
    }
    return (
      <AddNotificationDialog
        defaultOptions={{
          mustBeInStock: false,
          priceInCents: prices && prices[0] ? prices[0].priceInCents : undefined,
        }}
        onAddNotification={async ({ mustBeInStock, priceInCents }) => {
          const result = await createNotification(
            product.id,
            variant.id,
            mustBeInStock,
            priceInCents,
          );
          if (result.status === "success") {
            router.refresh();
          }
        }}
      />
    );
  };

  return (
    <Fragment>
      <section className="container max-w-4xl py-6">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">{product.store.name}</p>
          <h1 className="text-3xl font-medium">{product.name}</h1>
          <div className="grid grid-cols-[max-content_1fr] flex-wrap items-center gap-3 md:flex">
            <VariantControls
              attributes={options.attributes}
              productOptions={productOptions}
              onAttributesChange={(newAttributes) => {
                const newIndex = product.variants.findIndex((variant) => {
                  const attributes = variant.attributes as VariantAttribute[];
                  if (attributes.length !== Object.keys(newAttributes).length) return false;
                  return attributes.every((attribute) => {
                    return newAttributes[attribute.name] === attribute.value;
                  });
                });
                const newOptions: ControlOptions = {
                  ...options,
                  variantIndex: newIndex,
                  attributes: newAttributes,
                };
                setOptions(newOptions);
                loadPrices(newOptions);
              }}
            />
            <div className="col-span-2">
              <NotificationButton />
            </div>
          </div>
        </div>
        {/* TODO: hide this pill if product url doesn't exist? */}
        <a href={variant?.productUrl} target="_blank" rel="noopener noreferrer">
          <div className="text-md mt-5 inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600">
            {getPillText()}
          </div>
        </a>
      </section>
      <section className="container max-w-4xl space-y-2 py-6">
        <h2 className="text-xl font-medium">Price History</h2>
        <div className="flex flex-col justify-between gap-2 pb-2 sm:flex-row">
          <DateRangeControl
            dateRange={options.dateRange}
            onDateRangeChange={(newDateRange) => {
              const newOptions: ControlOptions = { ...options, dateRange: newDateRange };
              setOptions(newOptions);
              loadPrices(newOptions);
            }}
          />
          <div className="flex flex-row flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 border border-[#398739] bg-[#edffea]" /> In Stock
            </span>
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#2b8bad]" /> Uniqlo US
            </span>
          </div>
        </div>
        {prices?.length === 1000 ? (
          <div className="rounded-md border border-yellow-300 bg-yellow-100 p-4 text-yellow-900">
            Limited to showing only the first 1000 data points. Try applying filters to decrease the
            number of data points.
          </div>
        ) : null}
        <div className="h-[20rem] sm:h-[24rem] md:h-[28rem]">
          <ProductChart prices={prices} />
        </div>
      </section>
    </Fragment>
  );
}

async function createNotification(
  productId: string,
  variantId: string,
  mustBeInStock: boolean,
  priceInCents?: number,
) {
  const response = await fetch("/api/notifications/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variantId, priceInCents, mustBeInStock }),
  });
  return (await response.json()) as AddNotificationResponse;
}

async function deleteNotification(notificationId: string) {
  const response = await fetch("/api/notifications/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId }),
  });
  return (await response.json()) as DeleteNotificationResponse;
}
