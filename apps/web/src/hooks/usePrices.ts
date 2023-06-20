import { Price, ProductVariant } from "prisma-types";
import { useCallback, useState } from "react";

export type PriceWithVariant = Price & {
  productVariant: ProductVariant;
};

export function usePrices(productId: string) {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<PriceWithVariant[] | null>(null);

  const fetchPricesData = useCallback(
    async function (startDate: Date, style: string, size: string, abortSignal?: AbortSignal) {
      setLoading(true);

      const prices = await getPrices(productId, startDate, style, size, abortSignal);

      const aborted = abortSignal?.aborted ?? false;
      if (!aborted) {
        setPricesData(prices);
        setLoading(false);
      }
    },
    [productId]
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

// TODO: extract variant type?
async function getPrices(
  productId: string,
  startDate: Date,
  style: string,
  size: string,
  abortSignal?: AbortSignal
) {
  const response = await fetch("/api/prices", {
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

  // IMRPOVE THESE HARDCODED TYPES
  const json = await response.json();
  return json.prices as PriceWithVariant[];
}
