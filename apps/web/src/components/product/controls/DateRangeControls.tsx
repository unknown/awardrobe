"use client";

import { useOptimistic } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@ui/Tabs";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { DateRange, DateRanges, isDateRange } from "@/utils/dates";

export type DateRangeControlProps = {
  dateRange: DateRange;
};

export function DateRangeControl({ dateRange: initialDateRange }: DateRangeControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useOptimistic(initialDateRange);
  const { startTransition } = useProductInfo();

  return (
    <Tabs
      value={dateRange}
      onValueChange={(newRange: string) => {
        const range = isDateRange(newRange) ? newRange : "7d";
        startTransition(() => {
          setDateRange(range);
          const params = new URLSearchParams(searchParams);
          params.set("range", range);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }}
    >
      <TabsList>
        {DateRanges.map((range) => (
          <TabsTrigger key={range} value={range}>
            {range}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
