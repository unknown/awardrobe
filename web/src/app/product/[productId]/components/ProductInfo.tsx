"use client";

import { cn, formatDate, formatPrice, formatTimeAgo } from "@/utils/utils";
import {
  getPrices,
  PricesResponse,
  ProductResponse,
} from "@/utils/supabase-queries";
import { useCallback, useEffect, useRef, useState } from "react";
import { MemoizedProductChart } from "./ProductChart";
import { FiltersForm } from "./FiltersForm";

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
type DateRange = (typeof DateRanges)[number];
const dateOffsets: Record<DateRange, number> = {
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
  Month: 31 * 24 * 60 * 60 * 1000,
  "All Time": -1,
};
interface PricesInfoProps {
  productData: NonNullable<ProductResponse>;
}

export function ProductInfo({ productData }: PricesInfoProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PricesResponse>([]);
  const [lastUpdatedText, setLastUpdatedText] = useState("Last updated never");

  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>("Day");

  const updatePricesData = useCallback(
    async function (
      options: {
        dateRange?: DateRange;
        abortSignal?: AbortSignal;
      } = {}
    ) {
      const { dateRange: range = dateRange, abortSignal } = options;

      setLoading(true);

      const style = styleRef.current?.value;
      const size = sizeRef.current?.value;
      const pricesData = await getPrices(productData.id, {
        startDate: getStartDate(range) ?? undefined,
        style,
        size,
        abortSignal,
      });

      const aborted = abortSignal?.aborted ?? false;
      if (!aborted) {
        setData(pricesData);
        setLoading(false);
        handleUpdatedText(pricesData);
      }
    },
    [dateRange, productData.id]
  );

  // load initial prices data
  useEffect(() => {
    const abortController = new AbortController();
    updatePricesData({ abortSignal: abortController.signal });
    return () => {
      abortController.abort();
    };
  }, [updatePricesData]);

  // keep last updated text up-to-date
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
    if (updatedData?.at(0)) {
      const currentTime = new Date();
      const createdTime = new Date(updatedData[0].created_at);
      newText = `Last updated ${formatTimeAgo(currentTime, createdTime)}`;
    }
    setLastUpdatedText(newText);
  }

  function getStartDate(dateRange: DateRange) {
    if (dateRange === "All Time") {
      return null;
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
      <FiltersForm
        onFilter={() => {
          updatePricesData();
        }}
        styleRef={styleRef}
        sizeRef={sizeRef}
      >
        <DateControl
          dateRange={dateRange}
          onRangeChange={(range) => {
            if (dateRange == range) return;
            setDateRange(range);
            updatePricesData({ dateRange: range });
          }}
        />
      </FiltersForm>
      {data?.length === 1000 ? (
        <div className="rounded-md border border-orange-400 bg-orange-100 p-4 text-orange-700">
          There are over 1000 data points, but only the first 1000 data points
          are graphed. Try applying some filters!
        </div>
      ) : null}
      <MemoizedProductChart pricesData={data} />
    </div>
  );
}

interface DateControlProps {
  dateRange: DateRange;
  onRangeChange(newRange: DateRange): void;
}

export function DateControl({
  dateRange,
  onRangeChange: onClick,
}: DateControlProps) {
  return (
    <div className="inline-flex rounded-md">
      {DateRanges.map((range, i) => {
        const selected = dateRange === range;
        return (
          <button
            key={range}
            className={cn(
              "border border-gray-200 bg-white py-2 px-4 transition-colors hover:bg-gray-100",
              selected ? "bg-gray-200 hover:bg-gray-200" : null,
              i === 0 ? "rounded-l-md" : null,
              i < DateRanges.length - 1 ? "border-r-0" : null,
              i === DateRanges.length - 1 ? "rounded-r-md" : null
            )}
            onClick={() => {
              onClick(range);
            }}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
