export const DateRanges = ["7d", "1m", "3m", "6m", "1y", "All"] as const;

export type DateRange = (typeof DateRanges)[number];

export const isDateRange = (x: any): x is DateRange => DateRanges.includes(x);

const dateOffsets: Record<DateRange, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
  All: Infinity,
};

export function getDateFromRange(dateRange: DateRange) {
  const startDate = new Date();
  startDate.setTime(Math.max(0, startDate.getTime() - dateOffsets[dateRange]));
  return startDate;
}
