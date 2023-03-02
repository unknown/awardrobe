"use client";
import { DateRange, getPrices, PricesResponse } from "@/lib/supabaseClient";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { PricesChart } from "./PricesChart";
import { PricesForm } from "./PricesForm";

const initialDateRange: DateRange = "Day";

interface PricesInfoProps {
  productId: number;
}

export function PricesInfo({ productId }: PricesInfoProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PricesResponse>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState("Last updated never");

  function handleUpdatedText(updatedData: PricesResponse) {
    let newText = "Last updated never";
    if (updatedData && updatedData[0]) {
      const currentTime = new Date();
      const createdTime = new Date(updatedData[0].created_at);
      newText = `Last updated ${formatTimeAgo(currentTime, createdTime)}`;
    }
    setLastUpdatedText(newText);
  }

  const updatePricesData = useCallback(
    async (dateRange: DateRange, style?: string, size?: string) => {
      setLoading(true);
      const pricesData = await getPrices(productId, dateRange, style, size);
      setData(pricesData);
      setLoading(false);
      handleUpdatedText(pricesData);
    },
    [productId]
  );

  useEffect(() => {
    let isCanceled = false;
    const updatePrices = async () => {
      const pricesData = await getPrices(productId, initialDateRange);
      if (!isCanceled) {
        setData(pricesData);
        setLoading(false);
        handleUpdatedText(pricesData);
      }
    };
    updatePrices();
    return () => {
      isCanceled = true;
    };
  }, [productId]);

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

  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-gray-600"
        title={data && data[0] ? formatDate(new Date(data[0].created_at)) : ""}
      >
        {loading ? "Loading... " : lastUpdatedText}
      </p>
      <PricesForm
        updatePricesData={updatePricesData}
        initialDateRange={initialDateRange}
      />

      {data && data.length === 1000 ? (
        <div className="rounded-md border border-orange-400 bg-orange-100 p-4 text-orange-700">
          There are over 1000 data points, but only the first 1000 data points
          are graphed. Try applying some filters!
        </div>
      ) : null}
      <PricesChart pricesData={loading ? null : data} />
    </div>
  );
}
