"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ui/Button";

import { ProductNotification } from "@awardrobe/prisma-types";

import { ProductWithVariants } from "@/app/(product)/product/[productId]/page";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { formatCurrency } from "@/utils/utils";
import { isDateRange, usePrices, UsePricesOptions } from "../hooks/usePrices";
import { AddNotificationDialog } from "./AddNotificationDialog";
import { ProductChart } from "./ProductChart";
import { DateRangeControl, VariantControls } from "./ProductControls";

export type ProductInfoProps = {
  product: ProductWithVariants;
  styles: string[];
  sizes: string[];
  defaultNotifications: ProductNotification[];
};

export function ProductInfo({ product, styles, sizes, defaultNotifications }: ProductInfoProps) {
  const { data: prices, fetchPricesData } = usePrices(product.id);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [daterangeParams, styleParams, sizeParams] = [
    searchParams.get("dateRange"),
    searchParams.get("style"),
    searchParams.get("size"),
  ];

  const defaultOptions = useRef<UsePricesOptions>({
    dateRange: isDateRange(daterangeParams) ? daterangeParams : "7d",
    style: styleParams && styles.includes(styleParams) ? styleParams : styles[0] ?? "",
    size: sizeParams && sizes.includes(sizeParams) ? sizeParams : sizes[0] ?? "",
  });
  const [options, setOptions] = useState<UsePricesOptions>(defaultOptions.current);
  const [notifications, setNotifications] = useState<ProductNotification[]>(defaultNotifications);

  const loadPrices = useCallback(
    async (options: UsePricesOptions, abortSignal?: AbortSignal) => {
      await fetchPricesData(options, abortSignal);
    },
    [fetchPricesData],
  );

  useEffect(() => {
    const abortController = new AbortController();
    loadPrices(defaultOptions.current, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [loadPrices]);

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
    const selectedVariant = product.variants.find(
      (variant) => variant.style === options.style && variant.size === options.size,
    );
    const notification = notifications.find((notification) => {
      return notification.productVariantId === selectedVariant?.id;
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
        defaultOptions={{
          mustBeInStock: false,
          priceInCents: prices && prices[0] ? prices[0].priceInCents : undefined,
          style: options.style,
          size: options.size,
        }}
        onAddNotification={(newNotification) =>
          setNotifications((notifications) => [...notifications, newNotification])
        }
        sizes={sizes}
        styles={styles}
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
          <div className="grid grid-cols-[max-content_1fr] items-center gap-3 md:flex">
            <VariantControls
              variant={options}
              styles={styles}
              sizes={sizes}
              onVariantChange={(newVariant) => {
                const newOptions = { ...options, ...newVariant };
                setOptions(newOptions);
                loadPrices(newOptions);

                const params = new URLSearchParams({
                  ...Object.fromEntries(searchParams.entries()),
                  ...newOptions,
                });
                router.replace(`${pathname}?${params.toString()}`);
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
