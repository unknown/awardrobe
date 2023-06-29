import { useCallback, useState } from "react";

import { Price } from "@awardrobe/prisma-types";

import { GetPricesResponse } from "@/app/api/products/prices/route";

export const DateRanges = ["7d", "1m", "3m", "6m", "1y", "All"] as const;
export type DateRange = (typeof DateRanges)[number];
export const isDateRange = (x: any): x is DateRange => DateRanges.includes(x);
const dateOffsets: Record<DateRange, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
  All: Infinity,
};

export type UsePricesOptions = {
  dateRange: DateRange;
  style: string;
  size: string;
};

export function usePrices(productId: string) {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<Price[] | null>(null);

  const fetchPricesData = useCallback(
    async function ({ dateRange, style, size }: UsePricesOptions, abortSignal?: AbortSignal) {
      setLoading(true);

      const startDate = getStartDate(dateRange);
      const result = await getPrices(productId, startDate, style, size, abortSignal);
      if (abortSignal?.aborted) {
        return;
      }
      // TODO: handle error better
      if (result.status === "error") {
        setPricesData([]);
      } else {
        setPricesData(result.prices);
      }

      setLoading(false);
    },
    [productId],
  );

  const invalidateData = useCallback(() => {
    setPricesData(null);
  }, []);

  return {
    data: pricesData,
    loading,
    fetchPricesData,
    invalidateData,
  };
}

async function getPrices(
  productId: string,
  startDate: Date,
  style: string,
  size: string,
  abortSignal?: AbortSignal,
) {
  const response = await fetch("/api/products/prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      startDate,
      style,
      size,
    }),
    signal: abortSignal,
  });

  return (await response.json()) as GetPricesResponse;
}

function getStartDate(dateRange: DateRange) {
  const startDate = new Date();
  startDate.setTime(Math.max(0, startDate.getTime() - dateOffsets[dateRange]));
  return startDate;
}
