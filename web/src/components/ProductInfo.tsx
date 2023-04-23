"use client";

import { formatPrice } from "@/utils/utils";
import { useCallback, useEffect } from "react";
import { ProductChart } from "./ProductChart";
import { DateRange, FilterOptions, ProductControls } from "./ProductControls";
import { Database } from "@/lib/db-types";
import { usePrices } from "../hooks/usePrices";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export type PricesInfoProps = {
  productData: Product;
};

const defaultFilters: FilterOptions = {
  dateRange: "Day",
  style: "",
  size: "",
};

export function ProductInfo({ productData }: PricesInfoProps) {
  const { data: prices, loading, invalidateData, fetchPricesData } = usePrices(productData.id);

  const loadPricesData = useCallback(
    async (filters: FilterOptions, abortSignal?: AbortSignal) => {
      invalidateData();

      const { style, size, dateRange } = filters;
      const startDate = getStartDate(dateRange ?? dateRange);
      await fetchPricesData(startDate, style, size, abortSignal);
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

  const getLatestPrice = () => {
    if (prices === null || loading) {
      return "Loading...";
    }
    if (prices.length === 0) {
      return "No price data";
    }
    return formatPrice(prices[0].price_in_cents);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col justify-between">
        <h1 className="text-xl">{productData.name}</h1>
        <a
          href={`https://www.uniqlo.com/us/en/products/${productData.product_id}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600"
        >
          View item on Uniqlo
        </a>
      </div>
      <div>
        <p>Latest Price</p>
        <p className="text-2xl font-medium">{getLatestPrice()}</p>
      </div>
      <ProductControls
        defaultFilters={defaultFilters}
        onChange={async (newFilters) => {
          await loadPricesData(newFilters);
        }}
      />
      {prices?.length === 1000 ? (
        <div className="rounded-md border border-orange-400 bg-orange-100 p-4 text-orange-700">
          Warning: currently limited to showing only the first 1000 data points. Applying filters
          may decrease the number of data points.
        </div>
      ) : null}
      <div className="flex-grow">
        <ProductChart prices={prices} />
      </div>
    </div>
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