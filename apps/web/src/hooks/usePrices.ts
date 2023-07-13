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

export type FetchPricesOptions = {
  variantId: string;
  dateRange: DateRange;
  abortSignal?: AbortSignal;
};

export function usePrices() {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<Price[] | null>(null);

  const fetchPrices = useCallback(async function (options: FetchPricesOptions) {
    const { variantId, dateRange, abortSignal } = options;

    setLoading(true);
    const startDate = getStartDate(dateRange);
    const result = await getPrices(variantId, startDate, abortSignal);
    if (!abortSignal?.aborted) {
      // TODO: handle error better
      if (result.status === "error") {
        setPricesData([]);
      } else {
        setPricesData(result.prices);
      }
    }
    setLoading(false);
  }, []);

  const invalidateData = useCallback(() => {
    setPricesData([]);
  }, []);

  return {
    data: pricesData,
    loading,
    fetchPrices,
    invalidateData,
  };
}

async function getPrices(variantId: string, startDate: Date, abortSignal?: AbortSignal) {
  const response = await fetch("/api/products/prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variantId,
      startDate,
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
