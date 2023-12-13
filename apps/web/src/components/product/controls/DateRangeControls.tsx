"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ui/Button";
import { twMerge } from "tailwind-merge";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { DateRange, DateRanges } from "@/utils/dates";

export type DateRangeControlProps = {
  initialDateRange: DateRange;
};

export function DateRangeControl({ initialDateRange }: DateRangeControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState(initialDateRange);
  const { setIsLoading } = useProductInfo();

  return (
    <div aria-label="Select a date range">
      {DateRanges.map((range, index) => {
        const isSelected = range === dateRange;
        const [isFirst, isLast] = [index === 0, index === DateRanges.length - 1];
        const rounded = isFirst ? "rounded-r-none" : isLast ? "rounded-l-none" : "rounded-none";

        return (
          <Button
            key={range}
            variant="outline"
            onClick={() => {
              if (dateRange === range) {
                return;
              }

              setIsLoading(true);
              setDateRange(range);
              const params = new URLSearchParams(searchParams);
              params.set("range", range);
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }}
            className={twMerge(isSelected && "bg-slate-200", rounded, !isLast && "border-r-0")}
          >
            {range}
          </Button>
        );
      })}
    </div>
  );
}
