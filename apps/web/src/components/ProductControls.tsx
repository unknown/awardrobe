import React, { useState } from "react";

import { Button } from "@ui/Button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";

import { cn } from "@/utils/utils";

export type ProductControlsProps = {
  defaultFilters: FilterOptions;
  updateFilters: (newFilters: FilterOptions) => void;
  addNotification: (variants: Record<string, string>) => Promise<void>;
  variants: Record<string, string[]>;
};

const DateRanges = ["7d", "1m", "3m", "6m", "1y", "All"] as const;
export type DateRange = (typeof DateRanges)[number];

export type FilterOptions = {
  dateRange: DateRange;
  variants: Record<string, string>;
};

export function ProductControls({
  defaultFilters,
  updateFilters: consumerUpdateFilters,
  addNotification,
  variants,
}: ProductControlsProps) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    consumerUpdateFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addNotification(filters.variants);
        }}
      >
        {Object.entries(variants).map(([optionType, values]) => {
          return (
            <React.Fragment key={optionType}>
              <label htmlFor={`${optionType}-input`}>{optionType}</label>
              <Select
                onValueChange={(value) => {
                  const newVariants = { ...filters.variants, [optionType]: value };
                  updateFilters({ ...filters, variants: newVariants });
                }}
                defaultValue={defaultFilters.variants[optionType]}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`Select a ${optionType.toLowerCase()}...`} />
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
            </React.Fragment>
          );
        })}
        <Button>Add Notification</Button>
      </form>
      <label htmlFor="range-input">
        Price History
        <div id="range-input" aria-label="Select a date range">
          {DateRanges.map((range, index) => {
            const isSelected = range === filters.dateRange;
            const [isFirst, isLast] = [index === 0, index === DateRanges.length - 1];
            const rounded = isFirst ? "rounded-r-none" : isLast ? "rounded-l-none" : "rounded-none";

            return (
              <Button
                key={range}
                variant="outline"
                onClick={() => {
                  const newFilters = { ...filters, dateRange: range };
                  updateFilters(newFilters);
                }}
                className={cn(isSelected && "bg-slate-200", rounded, !isLast && "border-r-0")}
              >
                {range}
              </Button>
            );
          })}
        </div>
      </label>
    </div>
  );
}
