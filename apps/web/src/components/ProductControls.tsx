import { Fragment } from "react";
import { Button } from "@ui/Button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";

import { DateRange, DateRanges } from "@/hooks/usePrices";
import { cn } from "@/utils/utils";

// TODO: derive from ProductVariant type?
export type Variant = {
  style: string;
  size: string;
};

export type VariantControlsProps = {
  variant: Variant;
  onVariantChange: (newVariant: Variant) => void;
  styles: string[];
  sizes: string[];
};

export function VariantControls({ variant, styles, sizes, onVariantChange }: VariantControlsProps) {
  return (
    <Fragment>
      <label htmlFor="style-input" className="text-primary text-sm font-medium">
        Style
      </label>
      <Select
        value={variant.style}
        onValueChange={(style) => {
          onVariantChange({ ...variant, style });
        }}
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
      <label htmlFor="size-input" className="text-primary text-sm font-medium">
        Size
      </label>
      <Select
        value={variant.size}
        onValueChange={(size) => {
          onVariantChange({ ...variant, size });
        }}
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
    </Fragment>
  );
}

export type DateRangeControlProps = {
  dateRange: DateRange;
  onDateRangeChange: (newDateRange: DateRange) => void;
};

export function DateRangeControl({ dateRange, onDateRangeChange }: DateRangeControlProps) {
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
                onDateRangeChange(range);
              }
            }}
            className={cn(isSelected && "bg-slate-200", rounded, !isLast && "border-r-0")}
          >
            {range}
          </Button>
        );
      })}
    </div>
  );
}
