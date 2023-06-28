import { useCallback, useState } from "react";

import { Price } from "@awardrobe/prisma-types";

import { GetPricesResponse } from "@/app/api/products/prices/route";

export function usePrices(productId: string) {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<Price[] | null>(null);

  const fetchPricesData = useCallback(
    async function (startDate: Date, style: string, size: string, abortSignal?: AbortSignal) {
      setLoading(true);

      const result = await getPrices(productId, startDate, style, size, abortSignal);

      const aborted = abortSignal?.aborted ?? false;
      if (aborted) {
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
