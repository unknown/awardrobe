import { ButtonGroup } from "@ui/ButtonGroup";
import { Button } from "@ui/Button";
import { useState } from "react";
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
  styles: string[];
  sizes: string[];
};

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
export type DateRange = (typeof DateRanges)[number];

export type FilterOptions = {
  dateRange: DateRange;
  style?: string;
  size?: string;
};

export function ProductControls({
  defaultFilters,
  updateFilters: consumerUpdateFilters,
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
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label htmlFor="style-input">
          Style
          <Select
            onValueChange={(value) => {
              const newFilters = { ...filters, style: value };
              updateFilters(newFilters);
            }}
            defaultValue={defaultFilters.style ?? undefined}
          >
            <SelectTrigger className="w-[180px]">
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
        </label>
        <label htmlFor="size-input">
          Size
          <Select
            onValueChange={(value) => {
              const newFilters = { ...filters, size: value };
              updateFilters(newFilters);
            }}
            defaultValue={defaultFilters.size}
          >
            <SelectTrigger className="w-[180px]">
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
        </label>
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
