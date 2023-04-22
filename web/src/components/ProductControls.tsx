import { useRef, useState } from "react";
import { ButtonGroup } from "@ui/ButtonGroup";
import { Input } from "@ui/Input";
import { Button } from "@ui/Button";

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
type DateRange = (typeof DateRanges)[number];

export type ProductControlsProps = {
  onChange: (startDate: Date, style?: string, size?: string) => void;
};

export function ProductControls({ onChange: consumerOnChange }: ProductControlsProps) {
  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>("Day");

  const onChange = (range?: DateRange) => {
    const style = styleRef.current?.value;
    const size = sizeRef.current?.value;
    const startDate = getStartDate(range ?? dateRange);
    consumerOnChange(startDate, style, size);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label htmlFor="style-input">
          Style
          <Input id="style-input" ref={styleRef} onBlur={() => onChange()} />
        </label>
        <label htmlFor="size-input">
          Size
          <Input id="size-input" ref={sizeRef} onBlur={() => onChange()} />
        </label>
      </div>
      <label htmlFor="range-input">Price History</label>
      <ButtonGroup id="range-input">
        {DateRanges.map((range) => {
          const selected = range === dateRange;
          return (
            <Button
              key={range}
              variant="outline"
              onClick={() => {
                setDateRange(range);
                onChange(range);
              }}
              className={selected ? "bg-slate-200" : ""}
            >
              {range}
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}

const dateOffsets: Record<DateRange, number> = {
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
  Month: 31 * 24 * 60 * 60 * 1000,
  "All Time": Infinity,
};

function getStartDate(dateRange: DateRange) {
  const startDate = new Date();
  startDate.setTime(Math.max(0, startDate.getTime() - dateOffsets[dateRange]));
  return startDate;
}
