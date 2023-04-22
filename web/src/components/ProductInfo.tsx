"use client";

import { formatPrice } from "@/utils/utils";
import { useEffect } from "react";
import { ProductChart } from "./ProductChart";
import { ProductControls } from "./ProductControls";
import { Database } from "@/lib/db-types";
import { usePrices } from "../hooks/usePrices";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export type PricesInfoProps = {
  productData: Product;
};

export function ProductInfo({ productData }: PricesInfoProps) {
  const { data: prices, loading, invalidateData, fetchPricesData } = usePrices(productData.id);

  useEffect(() => {
    const abortController = new AbortController();
    fetchPricesData({ abortSignal: abortController.signal });
    return () => {
      abortController.abort();
    };
  }, [fetchPricesData]);

  const loadPrices = async (startDate: Date, style?: string, size?: string) => {
    invalidateData();
    await fetchPricesData({
      startDate,
      style,
      size,
    });
  };

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
    <div className="flex flex-col gap-4">
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
      <ProductControls onChange={loadPrices} />
      {prices?.length === 1000 ? (
        <div className="rounded-md border border-orange-400 bg-orange-100 p-4 text-orange-700">
          Warning: currently limited to showing only the first 1000 data points. Applying filters
          may decrease the number of data points.
        </div>
      ) : null}
      <ProductChart prices={prices} />
    </div>
  );
}
