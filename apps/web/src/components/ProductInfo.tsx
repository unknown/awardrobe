"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Button } from "@ui/Button";

import { VariantAttribute } from "@awardrobe/adapters";
import { ProductNotification } from "@awardrobe/prisma-types";

import { ProductWithVariants } from "@/app/(product)/product/[productId]/page";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { formatCurrency } from "@/utils/utils";
import { DateRange, usePrices } from "../hooks/usePrices";
import { AddNotificationDialog } from "./AddNotificationDialog";
import { ProductChart } from "./ProductChart";
import { DateRangeControl, VariantControls } from "./ProductControls";

type ControlOptions = {
  attributes: Record<string, string>;
  dateRange: DateRange;
};

export type ProductInfoProps = {
  product: ProductWithVariants;
  productOptions: Record<string, string[]>;
  initialOptions: ControlOptions;
  initialNotifications: ProductNotification[];
};

export function ProductInfo({
  product,
  productOptions,
  initialOptions,
  initialNotifications,
}: ProductInfoProps) {
  const { data: prices, fetchPrices } = usePrices();

  const [options, setOptions] = useState<ControlOptions>({ ...initialOptions });
  const [notifications, setNotifications] = useState<ProductNotification[]>(initialNotifications);

  const selectedVariant = product.variants.find((variant) => {
    const attributes = variant.attributes as VariantAttribute[];
    if (attributes.length !== Object.keys(options.attributes).length) return false;
    return attributes.every((attribute) => {
      return options.attributes[attribute.name] === attribute.value;
    });
  });

  const loadPrices = useCallback(
    async (options: ControlOptions, abortSignal?: AbortSignal) => {
      if (!selectedVariant) {
        return;
      }
      await fetchPrices({
        variantId: selectedVariant.id,
        dateRange: options.dateRange,
        abortSignal,
      });
    },
    [fetchPrices, selectedVariant],
  );

  useEffect(() => {
    const abortController = new AbortController();
    loadPrices(initialOptions, abortController.signal);
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
      return `${formatCurrency(lastPrice)} on Uniqlo`;
    }
  };

  const NotificationButton = () => {
    if (!selectedVariant) {
      return null;
    }
    const notification = notifications.find((notification) => {
      return notification.productVariantId === selectedVariant.id;
    });
    if (notification) {
      return (
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await deleteNotification(notification.id);
            if (result.status === "success") {
              setNotifications((notifications) =>
                [...notifications].filter((n) => n !== notification),
              );
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
        variantId={selectedVariant.id}
        defaultOptions={{
          mustBeInStock: false,
          priceInCents: prices && prices[0] ? prices[0].priceInCents : undefined,
        }}
        onAddNotification={(newNotification) =>
          setNotifications((notifications) => [...notifications, newNotification])
        }
        disabled={notification}
      />
    );
  };

  return (
    <Fragment>
      <section className="container max-w-4xl py-6">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">Uniqlo US</p>
          <h1 className="text-3xl font-medium">{product.name}</h1>
          <div className="grid grid-cols-[max-content_1fr] flex-wrap items-center gap-3 md:flex">
            <VariantControls
              attributes={options.attributes}
              productOptions={productOptions}
              onAttributesChange={(newAttributes) => {
                const newOptions = {
                  ...options,
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
        <div className="text-md mt-5 inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600">
          <a
            href={`https://www.uniqlo.com/us/en/products/${product.productCode}/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {getPillText()}
          </a>
        </div>
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
