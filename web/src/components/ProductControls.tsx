import { ButtonGroup } from "@ui/ButtonGroup";
import { Input } from "@ui/Input";
import { Button } from "@ui/Button";

export type ProductControlsProps = {
  filters: FilterOptions;
  onChange: (newFilters: FilterOptions) => void;
};

const DateRanges = ["Day", "Week", "Month", "All Time"] as const;
export type DateRange = (typeof DateRanges)[number];

export type FilterOptions = {
  dateRange: DateRange;
  style: string;
  size: string;
};

export function ProductControls({ filters, onChange: consumerOnChange }: ProductControlsProps) {
  const onChange = (newFilters: FilterOptions) => {
    consumerOnChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
        <label htmlFor="style-input">
          Style
          <Input
            id="style-input"
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
