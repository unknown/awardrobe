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

export type VariantControlsProps = {
  productOptions: Record<string, string[]>;
  attributes: Record<string, string>;
  onAttributesChange: (attributes: Record<string, string>) => void;
};

export function VariantControls({
  productOptions,
  attributes,
  onAttributesChange,
}: VariantControlsProps) {
  return (
    <Fragment>
      {Object.entries(productOptions).map(([name, values]) => {
        const selectedValue = attributes[name];
        return (
          <Fragment key={name}>
            <label htmlFor={`${name}-input`} className="text-primary text-sm font-medium">
              {name}
            </label>
            <Select
              value={selectedValue}
              onValueChange={(newValue) => {
                const newAttributes = { ...attributes, [name]: newValue };
                onAttributesChange(newAttributes);
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
