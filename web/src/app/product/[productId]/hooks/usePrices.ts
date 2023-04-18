import { getPrices } from "@/utils/supabase-queries";
import { Prices, PricesOptions } from "./types";
import { useCallback, useState } from "react";

export function usePrices(productId: number) {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<Prices[] | null>(null);

  const fetchPricesData = useCallback(
    async function (options: PricesOptions = {}) {
      const { style, size, startDate, abortSignal } = options;
      setLoading(true);

      // TODO: handle error
      const { data, error } = await getPrices(productId, {
        startDate,
        style,
        size,
        abortSignal,
      });

      const aborted = abortSignal?.aborted ?? false;
      if (!aborted) {
        setPricesData(data);
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
