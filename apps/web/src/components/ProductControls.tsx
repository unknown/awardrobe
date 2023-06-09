import { ButtonGroup } from "@ui/ButtonGroup";
import { Button } from "@ui/Button";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";

export type ProductControlsProps = {
  defaultFilters: FilterOptions;
  updateFilters: (newFilters: FilterOptions) => void;
  variants: Record<string, string[]>;
};

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
export type DateRange = (typeof DateRanges)[number];

export type FilterOptions = {
  dateRange: DateRange;
  variants: Record<string, string>;
};

export function ProductControls({
  defaultFilters,
  updateFilters: consumerUpdateFilters,
  variants,
}: ProductControlsProps) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    consumerUpdateFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
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
      </div>
      <label htmlFor="range-input">
        Price History
        <ButtonGroup id="range-input" aria-label="Select a date range">
          {DateRanges.map((range) => {
            const selected = range === filters.dateRange;
            return (
              <Button
                key={range}
                variant="outline"
                onClick={() => {
                  const newFilters = { ...filters, dateRange: range };
                  updateFilters(newFilters);
                }}
                className={selected ? "bg-slate-200" : ""}
              >
                {range}
              </Button>
            );
          })}
        </ButtonGroup>
      </label>
    </div>
  );
}
