"use client";

import { Fragment, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ui/Button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";
import { twMerge } from "tailwind-merge";

import { DateRange, DateRanges } from "@/utils/dates";

export type VariantControlsProps = {
  productOptions: Record<string, string[]>;
  initialAttributes: Record<string, string>;
};

export function VariantControls({ productOptions, initialAttributes }: VariantControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [attributes, setAttributes] = useState(initialAttributes);

  return (
    <div className="grid grid-cols-[max-content_1fr] flex-wrap items-center gap-3 md:flex">
      {Object.entries(productOptions).map(([name, values]) => {
        const selectedValue = attributes[name]; // TODO: handle undefined
        return (
          <Fragment key={name}>
            <label htmlFor={`${name}-input`} className="text-primary text-sm font-medium">
              {name}
            </label>
            <Select
              value={selectedValue}
              onValueChange={(value) => {
                setAttributes((attributes) => ({ ...attributes, [name]: value }));
                const params = new URLSearchParams({
                  ...attributes,
                  ...Object.fromEntries(searchParams.entries()),
                });
                params.set(name, value);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
            >
              <SelectTrigger className="max-w-[180px]" id={`${name}-input`}>
                <SelectValue placeholder={`Select a ${name}...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {values.map((value) => (
                    <SelectItem value={value} key={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Fragment>
        );
      })}
    </div>
  );
}

export type DateRangeControlProps = {
  initialDateRange: DateRange;
};

export function DateRangeControl({ initialDateRange }: DateRangeControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState(initialDateRange);

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
              if (dateRange !== range) {
                setDateRange(range);
                const params = new URLSearchParams(Object.fromEntries(searchParams.entries()));
                params.set("range", range);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }
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
