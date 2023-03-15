import { cn } from "@/utils/utils";
import { useRef, useState } from "react";
import { DateRange, DateRanges } from "./PricesInfo";

interface PricesFormProps {
  updatePricesData(range: DateRange, style?: string, size?: string): void;
  initialDateRange: DateRange;
}

interface DateControlProps {
  dateRange: DateRange;
  onClick(newRange: DateRange): void;
}

export function DateControl({ dateRange, onClick }: DateControlProps) {
  return (
    <div className="inline-flex rounded-md">
      {DateRanges.map((range, i) => {
        const selected = dateRange === range;
        return (
          <button
            key={range}
            className={cn(
              "border border-gray-200 bg-white py-2 px-4 transition-colors hover:bg-gray-100",
              selected ? "bg-gray-200 hover:bg-gray-200" : null,
              i === 0 ? "rounded-l-md" : null,
              i < DateRanges.length - 1 ? "border-r-0" : null,
              i === DateRanges.length - 1 ? "rounded-r-md" : null
            )}
            onClick={() => {
              onClick(range);
            }}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}

export function PricesForm({
  updatePricesData,
  initialDateRange,
}: PricesFormProps) {
  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = useState(initialDateRange);

  return (
    <div>
      <p className="mb-1 font-bold">Filters:</p>
      <form className="mb-4 flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label>
          Style:{" "}
          <input
            className="rounded-md border border-gray-200 p-2"
            placeholder="08"
            ref={styleRef}
          />
        </label>
        <label>
          Size:{" "}
          <input
            className="rounded-md border border-gray-200 p-2"
            placeholder="028"
            ref={sizeRef}
          />
        </label>
        <button
          className="rounded-md border border-gray-200 py-2 px-4"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            updatePricesData(
              dateRange,
              styleRef.current?.value,
              sizeRef.current?.value
            );
          }}
        >
          Apply Filters
        </button>
      </form>
      <DateControl
        dateRange={dateRange}
        onClick={(newRange: DateRange) => {
          if (dateRange === newRange) return;

          setDateRange(newRange);
          updatePricesData(
            newRange,
            styleRef.current?.value,
            sizeRef.current?.value
          );
        }}
      />
    </div>
  );
}
