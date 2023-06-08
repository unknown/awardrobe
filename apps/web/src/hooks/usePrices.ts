import { getPrices } from "@/utils/supabase-queries";
import { useCallback, useState } from "react";
import { Database } from "@/lib/db-types";

export type Prices = Database["public"]["Tables"]["prices"]["Row"];

export function usePrices(productId: number) {
  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<Prices[] | null>(null);

  const fetchPricesData = useCallback(
    async function (
      startDate: Date,
      options: { style?: string; size?: string; abortSignal?: AbortSignal } = {}
    ) {
      const { style, size, abortSignal } = options;

      setLoading(true);

      // TODO: handle error
      const { data, error } = await getPrices(productId, startDate, { style, size, abortSignal });

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
