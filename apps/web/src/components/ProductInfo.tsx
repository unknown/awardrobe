"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ui/Button";
import { ParentSize } from "@visx/responsive";

import { ProductNotification } from "@awardrobe/prisma-types";

import { ProductWithVariants } from "@/app/(product)/product/[productId]/page";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { formatCurrency } from "@/utils/utils";
import { usePrices } from "../hooks/usePrices";
import { AddNotificationDialog } from "./AddNotificationDialog";
import { ProductChart } from "./ProductChart";
import { DateRange, FilterOptions, isDateRange, ProductControls } from "./ProductControls";

export type ProductInfoProps = {
  product: ProductWithVariants;
  styles: string[];
  sizes: string[];
  defaultNotifications: ProductNotification[];
};

export function ProductInfo({ product, styles, sizes, defaultNotifications }: ProductInfoProps) {
  const { data: prices, loading, invalidateData, fetchPricesData } = usePrices(product.id);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [daterangeParams, styleParams, sizeParams] = [
    searchParams.get("dateRange"),
    searchParams.get("style"),
    searchParams.get("size"),
  ];
  const defaultFilters = useRef<FilterOptions>({
    dateRange: isDateRange(daterangeParams) ? daterangeParams : "7d",
    style: styleParams ?? styles[0] ?? "",
    size: sizeParams ?? sizes[0] ?? "",
  });

  const [filters, setFilters] = useState<FilterOptions>(defaultFilters.current);
  const [notifications, setNotifications] = useState<ProductNotification[]>(defaultNotifications);

  const loadPricesData = useCallback(
    async ({ dateRange, style, size }: FilterOptions, abortSignal?: AbortSignal) => {
      invalidateData();
      const startDate = getStartDate(dateRange);
      await fetchPricesData(startDate, style, size, abortSignal);
    },
    [invalidateData, fetchPricesData],
  );

  useEffect(() => {
    const abortController = new AbortController();
    loadPricesData(defaultFilters.current, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [loadPricesData]);

  const getLatestPriceText = () => {
    if (prices === null || loading) {
      return "Loading...";
    }

    const lastPrice = prices[prices.length - 1];
    if (!lastPrice) {
      return "No price data";
    } else {
      return formatCurrency(lastPrice.priceInCents);
    }
  };

  // TODO: handle invalid product controls state when `prices` is invalidated
  return (
    <Fragment>
      <section className="container space-y-2">
        <h1 className="text-2xl font-medium">{product.name}</h1>
        <a
          href={`https://www.uniqlo.com/us/en/products/${product.productCode}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600"
        >
          View item on Uniqlo
        </a>
        <div>
          <p className="text-sm font-medium">Latest Price</p>
          <p className="text-2xl font-medium">{getLatestPriceText()}</p>
        </div>
      </section>
      <section className="container py-4">
        <ProductControls
          filters={filters}
          onFiltersChange={async (newFilters) => {
            // TODO: fix this hacky way of creating `params` when types are fixed
            const params = new URLSearchParams({
              ...Object.fromEntries(searchParams.entries()),
              ...newFilters,
            });
            router.replace(`${pathname}?${params.toString()}`);

            setFilters(newFilters);
            await loadPricesData(newFilters);
          }}
          styles={styles}
          sizes={sizes}
          renderNotificationsComponent={(style, size) => {
            const variant = product.variants.find((variant) => {
              return variant.style === style && variant.size === size;
            });
            const notification = notifications.find((notification) => {
              return notification.productVariantId === variant?.id;
            });
            const hasExistingNotification = notification !== undefined;

            if (hasExistingNotification) {
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
                  style: filters.style,
                  size: filters.size,
                }}
                onAddNotification={(newNotification) =>
                  setNotifications((notifications) => [...notifications, newNotification])
                }
                sizes={sizes}
                styles={styles}
                disabled={hasExistingNotification}
              />
            );
          }}
        />
        {prices?.length === 1000 ? (
          <div className="rounded-md border border-yellow-300 bg-yellow-100 p-4 text-yellow-900">
            Limited to showing only the first 1000 data points. Try applying filters to decrease the
            number of data points.
          </div>
        ) : null}
      </section>
      <section className="container h-[20rem] sm:h-[24rem] md:h-[32rem]">
        <ParentSize>
          {({ width, height }) => <ProductChart width={width} height={height} prices={prices} />}
        </ParentSize>
      </section>
    </Fragment>
  );
}

const dateOffsets: Record<DateRange, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
  All: Infinity,
};

function getStartDate(dateRange: DateRange) {
  const startDate = new Date();
  startDate.setTime(Math.max(0, startDate.getTime() - dateOffsets[dateRange]));
  return startDate;
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
