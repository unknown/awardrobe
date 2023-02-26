import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const timeFormatter = new Intl.RelativeTimeFormat("en");

const TIME_UNITS = [
  { limit: 60, unit: "seconds" },
  { limit: 60, unit: "minutes" },
  { limit: 24, unit: "hours" },
  { limit: 7, unit: "days" },
  { limit: 4.5, unit: "weeks" },
  { limit: 12, unit: "months" },
] as const;

export function formatTimeAgo(prev: Date, now: Date = new Date()) {
  let elapsedInUnits = (now.getTime() - prev.getTime()) / 1000;
  if (0 < elapsedInUnits && elapsedInUnits < 1) return "Just now";

  for (const unit of TIME_UNITS) {
    const roundedElapsedInUnits = Math.round(elapsedInUnits);
    if (Math.abs(roundedElapsedInUnits) < unit.limit) {
      return timeFormatter.format(roundedElapsedInUnits, unit.unit);
    }
    elapsedInUnits /= unit.limit;
  }

  return timeFormatter.format(Math.round(elapsedInUnits), "years");
}
