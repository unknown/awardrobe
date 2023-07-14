"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/Button";

import { VariantAttribute } from "@awardrobe/adapters";
import { ProductVariant } from "@awardrobe/prisma-types";

import { ExtendedProduct, VariantWithNotification } from "@/app/(product)/product/[productId]/page";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { formatCurrency } from "@/utils/utils";
import { DateRange, usePrices } from "../hooks/usePrices";
import { AddNotificationDialog } from "./AddNotificationDialog";
import { ProductChart } from "./ProductChart";
import { DateRangeControl, VariantControls } from "./ProductControls";

type ControlOptions = {
  variant?: VariantWithNotification;
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

  const [options, setOptions] = useState<ControlOptions>({ ...initialOptions });

  const loadPrices = useCallback(
    async (options: {
      variant?: ProductVariant;
      dateRange: DateRange;
      abortSignal?: AbortSignal;
    }) => {
      if (!options.variant) {
        invalidateData();
        return;
      }
      await fetchPrices({
        variantId: options.variant.id,
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

  const getPillText = () => {
    const lastPrice = prices?.[prices.length - 1]?.priceInCents;
    if (prices === null) {
      return "Loading...";
    } else if (lastPrice === undefined) {
      return "See price";
    } else {
      return `${formatCurrency(lastPrice)} on ${product.store.shortenedName ?? product.store.name}`;
    }
  };

  const NotificationButton = () => {
    const variant = options.variant;
    if (!variant) {
      return null;
    }
    const notification = variant.notifications[0];

    if (notification) {
      return (
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await deleteNotification(notification.id);
            if (result.status === "success") {
              setOptions((options) => ({ ...options, variant: { ...variant, notifications: [] } }));
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
        productId={product.id}
        variantId={variant.id}
        defaultOptions={{
          mustBeInStock: false,
          priceInCents: prices && prices[0] ? prices[0].priceInCents : undefined,
        }}
        onAddNotification={(newNotification) => {
          setOptions((options) => ({
            ...options,
            variant: { ...variant, notifications: [newNotification] },
          }));
          router.refresh();
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
                const selectedVariant = product.variants.find((variant) => {
                  const attributes = variant.attributes as VariantAttribute[];
                  if (attributes.length !== Object.keys(newAttributes).length) return false;
                  return attributes.every((attribute) => {
                    return newAttributes[attribute.name] === attribute.value;
                  });
                });
                const newOptions = {
                  ...options,
                  variant: selectedVariant,
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
        <a href={options.variant?.productUrl} target="_blank" rel="noopener noreferrer">
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
              const newOptions = { ...options, dateRange: newDateRange };
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

async function deleteNotification(notificationId: string) {
  const response = await fetch("/api/notifications/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId,
    }),
  });
  return (await response.json()) as DeleteNotificationResponse;
}
