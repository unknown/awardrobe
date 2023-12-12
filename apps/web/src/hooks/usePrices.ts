import { useCallback, useState } from "react";

import { Price } from "@awardrobe/prisma-types";

import { GetPricesResponse } from "@/app/api/prices/route";
import { DateRange, getDateFromRange } from "@/utils/dates";

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
    const startDate = getDateFromRange(dateRange);
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
  const response = await fetch("/api/prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId, startDate }),
    signal: abortSignal,
  });
  return (await response.json()) as GetPricesResponse;
}
