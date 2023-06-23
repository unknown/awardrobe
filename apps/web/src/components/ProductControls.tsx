"use client";

import { ReactElement } from "react";
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

export type FilterOptions = {
  dateRange: DateRange;
  style: string;
  size: string;
};

export type ProductControlsProps = {
  filters: FilterOptions;
  onFiltersUpdate: (newFilters: FilterOptions) => void;
  styles: string[];
  sizes: string[];
  renderNotificationsComponent: (style: string, size: string) => ReactElement;
};

const DateRanges = ["7d", "1m", "3m", "6m", "1y", "All"] as const;
export type DateRange = (typeof DateRanges)[number];

export function ProductControls({
  filters,
  onFiltersUpdate: consumerOnFiltersUpdate,
  styles,
  sizes,
  renderNotificationsComponent,
}: ProductControlsProps) {
  const onFiltersUpdate = (newFilters: FilterOptions) => {
    consumerOnFiltersUpdate(newFilters);
  };

  return (
    <div className="space-y-2">
      <section className="flex flex-col items-start gap-2 md:flex-row md:items-end md:gap-2">
        <fieldset>
          <label htmlFor="style-input" className="text-primary text-sm font-medium">
            Style
          </label>
          <Select
            onValueChange={(style) => {
              onFiltersUpdate({ ...filters, style });
            }}
            value={filters.style}
          >
            <SelectTrigger className="w-[180px]" id="style-input">
              <SelectValue placeholder="Select a style..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {styles.map((style) => (
                  <SelectItem value={style} key={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset>
          <label htmlFor="size-input" className="text-primary text-sm font-medium">
            Size
          </label>
          <Select
            onValueChange={(size) => {
              onFiltersUpdate({ ...filters, size });
            }}
            value={filters.size}
          >
            <SelectTrigger className="w-[180px]" id="size-input">
              <SelectValue placeholder="Select a size..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sizes.map((size) => (
                  <SelectItem value={size} key={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        {renderNotificationsComponent(filters.style, filters.size)}
      </section>
      <div>
        <label htmlFor="range-input" className="text-primary text-sm font-medium">
          Price History
        </label>
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
                  onFiltersUpdate({ ...filters, dateRange: range });
                }}
                className={cn(isSelected && "bg-slate-200", rounded, !isLast && "border-r-0")}
              >
                {range}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
