"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@ui/Button";

import { ProductNotification } from "@awardrobe/prisma-types";

import { ProductWithVariants } from "@/app/(product)/product/[productId]/page";
import { formatPrice } from "@/utils/utils";
import { usePrices } from "../hooks/usePrices";
import { AddNotificationDialog, NotificationOptions } from "./AddNotificationDialog";
import { ProductChart } from "./ProductChart";
import { DateRange, FilterOptions, ProductControls } from "./ProductControls";

export type ProductInfoProps = {
  product: ProductWithVariants;
  defaultNotifications: ProductNotification[];
};

export function ProductInfo({ product, defaultNotifications }: ProductInfoProps) {
  const { data: prices, loading, invalidateData, fetchPricesData } = usePrices(product.id);

  const { styles, sizes } = useMemo<{
    styles: string[];
    sizes: string[];
  }>(() => {
    const stylesSet = new Set<string>();
    const sizesSet = new Set<string>();
    product.variants.forEach((variant) => {
      stylesSet.add(variant.style);
      sizesSet.add(variant.size);
    });
    return {
      styles: Array.from(stylesSet),
      sizes: Array.from(sizesSet),
    };
  }, [product]);

  const defaultFilters = useRef<FilterOptions>({
    dateRange: "7d",
    style: styles[0] ?? "",
    size: sizes[0] ?? "",
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
    } else if (!prices[0]) {
      return "No price data";
    } else {
      return formatPrice(prices[0].priceInCents);
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
          onFiltersUpdate={async (newFilters) => {
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
                    await deleteNotification(notification.id);
                    setNotifications((notifications) =>
                      [...notifications].filter((n) => n !== notification),
                    );
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
                  style: filters.style,
                  size: filters.size,
                }}
                onNotificationUpdate={async (options) => {
                  const {
                    status,
                    notification,
                  }: { status: string; notification?: ProductNotification } =
                    await createNotification(product.id, options);
                  if (status === "error") {
                    return false;
                  }
                  if (notification) {
                    setNotifications((notifications) => [...notifications, notification]);
                  }
                  return true;
                }}
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
      <section className="container h-[40rem] py-4">
        <ProductChart prices={prices} />
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

// TODO: make these more type-safe
async function createNotification(productId: string, notificationOptions: NotificationOptions) {
  const { style, size, priceInCents, mustBeInStock } = notificationOptions;
  const response = await fetch("/api/notifications/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      style,
      size,
      priceInCents,
      mustBeInStock,
    }),
  });
  return response.json();
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
  return response.json();
}
