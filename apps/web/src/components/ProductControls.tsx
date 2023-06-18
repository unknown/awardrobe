import { Fragment, useState } from "react";

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
  addNotification: (style: string, size: string) => Promise<void>;
  styles: string[];
  sizes: string[];
};

const DateRanges = ["7d", "1m", "3m", "6m", "1y", "All"] as const;
export type DateRange = (typeof DateRanges)[number];

export type FilterOptions = {
  dateRange: DateRange;
  style: string;
  size: string;
};

export function ProductControls({
  defaultFilters,
  updateFilters: consumerUpdateFilters,
  addNotification,
  styles,
  sizes,
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
          addNotification(filters.style, filters.size);
        }}
      >
        <Fragment>
          <label htmlFor={`style-input`}>Style</label>
          <Select
            onValueChange={(style) => {
              updateFilters({ ...filters, style });
            }}
            defaultValue={defaultFilters.style}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`Select a style...`} />
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
        </Fragment>
        <Fragment>
          <label htmlFor={`size-input`}>Color</label>
          <Select
            onValueChange={(size) => {
              updateFilters({ ...filters, size });
            }}
            defaultValue={defaultFilters.size}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`Select a size...`} />
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
        </Fragment>
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
