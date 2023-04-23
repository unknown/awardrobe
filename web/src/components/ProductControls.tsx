import { ButtonGroup } from "@ui/ButtonGroup";
import { Input } from "@ui/Input";
import { Button } from "@ui/Button";
import { useCallback, useState } from "react";

export type ProductControlsProps = {
  defaultFilters: FilterOptions;
  onChange: (newFilters: FilterOptions) => void;
};

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
export type DateRange = (typeof DateRanges)[number];

export type FilterOptions = {
  dateRange: DateRange;
  style: string;
  size: string;
};

export function ProductControls({
  defaultFilters,
  onChange: consumerOnChange,
}: ProductControlsProps) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const onChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    consumerOnChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label htmlFor="style-input">
          Style
          <Input
            id="style-input"
            defaultValue={filters.style}
            onBlur={(event) => {
              const newFilters = { ...filters, style: event.target.value };
              onChange(newFilters);
            }}
          />
        </label>
        <label htmlFor="size-input">
          Size
          <Input
            id="size-input"
            defaultValue={filters.size}
            onBlur={(event) => {
              const newFilters = { ...filters, size: event.target.value };
              onChange(newFilters);
            }}
          />
        </label>
      </div>
      <label htmlFor="range-input">
        Price History
        <ButtonGroup id="range-input">
          {DateRanges.map((range) => {
            const selected = range === filters.dateRange;
            return (
              <Button
                key={range}
                variant="outline"
                onClick={() => {
                  const newFilters = { ...filters, dateRange: range };
                  onChange(newFilters);
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