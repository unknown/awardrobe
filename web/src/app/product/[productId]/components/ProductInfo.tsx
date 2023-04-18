"use client";

import { cn, formatPrice } from "@/utils/utils";
import { useEffect, useRef, useState } from "react";
import { MemoizedProductChart } from "./ProductChart";
import { FiltersForm } from "./FiltersForm";
import { Database } from "@/lib/db-types";
import { usePrices } from "../hooks/usePrices";

export type Product = Database["public"]["Tables"]["products"]["Row"];
interface PricesInfoProps {
  productData: Product;
}

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;

export type DateRange = (typeof DateRanges)[number];

export function ProductInfo({ productData }: PricesInfoProps) {
  const { data: prices, ...priceUtils } = usePrices(productData.id);

  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>("Day");

  const loadPrices = async () => {
    priceUtils.invalidateData();
    await priceUtils.fetchPricesData({
      startDate: getStartDate(dateRange),
      style: styleRef.current?.value,
      size: sizeRef.current?.value,
    });
  };

  // load initial prices data
  useEffect(() => {
    const abortController = new AbortController();
    priceUtils.fetchPricesData({ abortSignal: abortController.signal });
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
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
        <p></p>
        <p className="text-2xl font-medium">
          {prices && prices.length > 0
            ? formatPrice(prices[0].price_in_cents)
            : "No price data"}
        </p>
      </div>
      <FiltersForm
        onFilter={() => {
          loadPrices();
        }}
        styleRef={styleRef}
        sizeRef={sizeRef}
      >
        <DateControl
          dateRange={dateRange}
          onRangeChange={(range) => {
            if (dateRange == range) return;
            setDateRange(range);
            loadPrices();
          }}
        />
      </FiltersForm>
      {prices?.length === 1000 ? (
        <div className="rounded-md border border-orange-400 bg-orange-100 p-4 text-orange-700">
          There are over 1000 data points, but only the first 1000 data points
          are graphed. Try applying some filters!
        </div>
      ) : null}
      <MemoizedProductChart pricesData={prices} />
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

const dateOffsets: Record<DateRange, number> = {
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
  Month: 31 * 24 * 60 * 60 * 1000,
  "All Time": Infinity,
};

function getStartDate(dateRange: DateRange) {
  const startDate = new Date();
  startDate.setTime(startDate.getTime() - dateOffsets[dateRange]);
  return startDate;
}
