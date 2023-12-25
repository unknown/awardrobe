"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@ui/ToggleGroup";

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
    <ToggleGroup
      className="bg-muted text-muted-foreground rounded-lg p-1"
      type="single"
      value={dateRange}
      onValueChange={(range: DateRange) => {
        setIsLoading(true);
        setDateRange(range);
        const params = new URLSearchParams(searchParams);
        params.set("range", range);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }}
    >
      {DateRanges.map((range) => (
        <ToggleGroupItem
          className="data-[state=on]:bg-background data-[state=on]:shadow"
          key={range}
          value={range}
        >
          {range}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
