"use client";

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
import AddNotificationDialog from "./AddNotificationDialog";
import { FilterOptions } from "./ProductInfo";
import { useState } from "react";

export type NotificationOptions = {
  style: string;
  size: string;
  mustBeInStock: boolean;
  priceInCents?: number;
};

export type ProductControlsProps = {
  filters: FilterOptions;
  updateFilters: (newFilters: FilterOptions) => void;
  createNotification: (options: NotificationOptions) => Promise<void>;
  styles: string[];
  sizes: string[];
};

const DateRanges = ["7d", "1m", "3m", "6m", "1y", "All"] as const;
export type DateRange = (typeof DateRanges)[number];

export function ProductControls({
  filters,
  updateFilters: consumerUpdateFilters,
  createNotification,
  styles,
  sizes,
}: ProductControlsProps) {
  const [notificationOptions, setNotificationOptions] = useState<NotificationOptions>({
    style: filters.style,
    size: filters.size,
    mustBeInStock: false,
  });

  const updateFilters = (newFilters: FilterOptions) => {
    consumerUpdateFilters(newFilters);
    setNotificationOptions({
      ...notificationOptions,
      style: newFilters.style,
      size: newFilters.size,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <form className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label htmlFor="style-input">Style</label>
        <Select
          onValueChange={(style) => {
            updateFilters({ ...filters, style });
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
        <label htmlFor="size-input">Color</label>
        <Select
          onValueChange={(size) => {
            updateFilters({ ...filters, size });
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
        <AddNotificationDialog
          options={notificationOptions}
          setOptions={(newOptions) => setNotificationOptions(newOptions)}
          createNotification={() => createNotification(notificationOptions)}
          sizes={sizes}
          styles={styles}
        />
      </form>
      <div>
        <label htmlFor="range-input">Price History</label>
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
                  updateFilters({ ...filters, dateRange: range });
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
