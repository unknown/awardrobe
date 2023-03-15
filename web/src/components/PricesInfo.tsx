"use client";

import { formatDate, formatPrice, formatTimeAgo } from "@/utils/utils";
import {
  getPrices,
  PricesResponse,
  ProductResponse,
} from "@/utils/supabase-queries";
import { useEffect, useState } from "react";
import { MemoizedPricesChart } from "./PricesChart";
import { PricesForm } from "./PricesForm";

export const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
export type DateRange = (typeof DateRanges)[number];
const dateOffsets: Record<DateRange, number> = {
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
  Month: 31 * 24 * 60 * 60 * 1000,
  "All Time": -1,
};
const initialDateRange: DateRange = "Day";

interface PricesInfoProps {
  productData: NonNullable<ProductResponse>;
}

export function PricesInfo({ productData }: PricesInfoProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PricesResponse>([]);
  const [lastUpdatedText, setLastUpdatedText] = useState("Last updated never");

  useEffect(() => {
    const controller = new AbortController();

    const updatePrices = async () => {
      const pricesData = await getPrices(productData.id, {
        startDate: getStartDate(initialDateRange),
        abortSignal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setData(pricesData);
        setLoading(false);
        handleUpdatedText(pricesData);
      }
    };

    updatePrices();

    return () => {
      controller.abort();
    };
  }, [productData]);

  useEffect(() => {
    if (!data || !data[0]) return;

    const createdTime = new Date(data[0].created_at);
    const timeDiff = new Date().getTime() - createdTime.getTime();
    const timeUntilWholeMinute = 60_000 - (timeDiff % 60_000);

    let intervalId: NodeJS.Timer;
    const timeoutId = setTimeout(() => {
      handleUpdatedText(data);
      intervalId = setInterval(() => {
        handleUpdatedText(data);
      }, 60_000);
    }, timeUntilWholeMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [data]);

  function handleUpdatedText(updatedData: PricesResponse) {
    let newText = "Last updated never";
    if (updatedData && updatedData[0]) {
      const currentTime = new Date();
      const createdTime = new Date(updatedData[0].created_at);
      newText = `Last updated ${formatTimeAgo(currentTime, createdTime)}`;
    }
    setLastUpdatedText(newText);
  }

  const updatePricesData = async (
    dateRange: DateRange,
    style?: string,
    size?: string
  ) => {
    setLoading(true);
    const pricesData = await getPrices(productData.id, {
      startDate: getStartDate(dateRange),
      style,
      size,
    });
    setData(pricesData);
    setLoading(false);
    handleUpdatedText(pricesData);
  };

  function getStartDate(dateRange: DateRange) {
    if (dateRange === "All Time") {
      return;
    }

    const startDate = new Date();
    startDate.setTime(startDate.getTime() - dateOffsets[dateRange]);
    return startDate;
  }

  const updatedTitle = data?.at(0)
    ? formatDate(new Date(data[0].created_at))
    : "";
  const prices = data?.map((d) => d.price_in_cents);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between">
        <h1 className="text-3xl font-bold">{productData.name}</h1>
        <a
          href={`https://www.uniqlo.com/us/en/products/${productData.product_id}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600"
        >
          View item on Uniqlo
        </a>
        <p className="mt-2 text-2xl">
          {prices && prices.length > 0
            ? formatPrice(Math.min(...prices))
            : "No price data"}
        </p>
        <p className="text-gray-600" title={updatedTitle}>
          {loading ? "Loading... " : lastUpdatedText}
        </p>
      </div>
      <PricesForm
        updatePricesData={updatePricesData}
        initialDateRange={initialDateRange}
      />
      {data?.length === 1000 ? (
        <div className="rounded-md border border-orange-400 bg-orange-100 p-4 text-orange-700">
          There are over 1000 data points, but only the first 1000 data points
          are graphed. Try applying some filters!
        </div>
      ) : null}
      <MemoizedPricesChart pricesData={data} />
    </div>
  );
}
