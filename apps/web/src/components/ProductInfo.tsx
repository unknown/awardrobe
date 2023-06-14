"use client";

import { Fragment, useCallback, useEffect, useRef } from "react";

import { formatPrice } from "@/utils/utils";

import { usePrices } from "../hooks/usePrices";
import { ProductChart } from "./ProductChart";
import { DateRange, FilterOptions, ProductControls } from "./ProductControls";

export type ProductInfoProps = {
  productId: string;
  variants: Record<string, string[]>;
};

export function ProductInfo({ productId, variants }: ProductInfoProps) {
  const { data: prices, loading, invalidateData, fetchPricesData } = usePrices(productId);

  const defaultFilters = useRef<FilterOptions>({
    dateRange: "7d",
    variants: Object.entries(variants).reduce((variants, [name, values]) => {
      variants[name] = values[0];
      return variants;
    }, {} as Record<string, string>),
  });

  const loadPricesData = useCallback(
    async (filters: FilterOptions, abortSignal?: AbortSignal) => {
      invalidateData();
      const startDate = getStartDate(filters.dateRange);
      await fetchPricesData(startDate, filters.variants, abortSignal);
    },
    [invalidateData, fetchPricesData]
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
    } else if (prices.length === 0) {
      return "No price data";
    } else {
      return formatPrice(prices[0].priceInCents);
    }
  };

  return (
    <Fragment>
      <div>
        <p>Latest Price</p>
        <p className="text-2xl font-medium">{getLatestPriceText()}</p>
      </div>
      <ProductControls
        defaultFilters={defaultFilters.current}
        updateFilters={async (newFilters) => {
          await loadPricesData(newFilters);
        }}
        addNotification={async (variants) => {
          const response = await fetch("/api/add-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId,
              priceInCents: undefined, // TODO: populate this with user-defined value
              mustBeInStock: false,
              variants,
            }),
          });
          if (response.status === 200) {
            console.log("Added notification");
          }
        }}
        variants={variants}
      />
      {prices?.length === 1000 ? (
        <div className="rounded-md border border-yellow-300 bg-yellow-100 p-4 text-yellow-900">
          Limited to showing only the first 1000 data points. Try applying filters to decrease the
          number of data points.
        </div>
      ) : null}
      <div className="flex-grow">
        <ProductChart prices={prices} />
      </div>
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
