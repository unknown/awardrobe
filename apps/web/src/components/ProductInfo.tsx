"use client";

import { formatPrice } from "@/utils/utils";
import { Fragment, useCallback, useEffect } from "react";
import { ProductChart } from "./ProductChart";
import { DateRange, FilterOptions, ProductControls } from "./ProductControls";
import { usePrices } from "../hooks/usePrices";

export type ProductInfoProps = {
  productId: string;
  variants: Record<string, string[]>;
};

export function ProductInfo({ productId, variants }: ProductInfoProps) {
  const { data: prices, loading, invalidateData, fetchPricesData } = usePrices(productId);

  const defaultVariants = Object.entries(variants).reduce((variants, [name, values]) => {
    variants[name] = values[0];
    return variants;
  }, {} as Record<string, string>);
  const defaultFilters: FilterOptions = {
    dateRange: "Day",
    variants: defaultVariants,
  };

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
    loadPricesData(defaultFilters, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [loadPricesData]);

  const getLatestPriceText = () => {
    if (prices === null || loading) {
      return "Loading...";
    }
    if (prices.length === 0) {
      return "No price data";
    }
    return formatPrice(prices[0].priceInCents);
  };

  return (
    <Fragment>
      <div>
        <p>Latest Price</p>
        <p className="text-2xl font-medium">{getLatestPriceText()}</p>
      </div>
      <ProductControls
        defaultFilters={defaultFilters}
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
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
  Month: 31 * 24 * 60 * 60 * 1000,
  "All Time": Infinity,
};

function getStartDate(dateRange: DateRange) {
  const startDate = new Date();
  startDate.setTime(Math.max(0, startDate.getTime() - dateOffsets[dateRange]));
  return startDate;
}
