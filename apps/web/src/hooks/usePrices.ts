import { Price, ProductVariant } from "database";
import { useCallback, useState } from "react";

export type PriceWithVariants = Price & {
  variants: ProductVariant[];
};

export function usePrices(productId: string) {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<PriceWithVariants[] | null>(null);

  const fetchPricesData = useCallback(
    async function (startDate: Date, variants: Record<string, string>, abortSignal?: AbortSignal) {
      setLoading(true);

      const prices = await getPrices(productId, startDate, variants, abortSignal);

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
  variants: Record<string, string>,
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
      variants,
    }),
    signal: abortSignal,
  });

  // IMRPOVE THESE HARDCODED TYPES
  const json = await response.json();
  return json.prices as PriceWithVariants[];
}
