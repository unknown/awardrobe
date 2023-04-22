import { useRef, useState } from "react";
import { ButtonGroup } from "@ui/ButtonGroup";
import { Input } from "@ui/Input";
import { Button } from "@ui/Button";

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
type DateRange = (typeof DateRanges)[number];

export type ProductControlsProps = {
  onFilter: (startDate?: Date, style?: string, size?: string) => void;
};

export function ProductControls({ onFilter }: ProductControlsProps) {
  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>("Day");

  const filter = (range?: DateRange) => {
    const style = styleRef.current?.value;
    const size = sizeRef.current?.value;
    const startDate = getStartDate(range ?? dateRange);

    onFilter(startDate, style, size);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label>
          Style
          <Input ref={styleRef} onBlur={() => filter()} />
        </label>
        <label>
          Size
          <Input ref={sizeRef} onBlur={() => filter()} />
        </label>
        <label>
          Price History
          <ButtonGroup>
            {DateRanges.map((range) => {
              const selected = dateRange === range;
              return (
                <Button
                  key={range}
                  variant="outline"
                  onClick={() => {
                    setDateRange(range);
                    filter(range);
                  }}
                  className={selected ? "bg-gray-200" : ""}
                >
                  {range}
                </Button>
              );
            })}
          </ButtonGroup>
        </label>
      </div>
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
