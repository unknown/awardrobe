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
  function rounded(units: number) {
    return units < 0 ? Math.ceil(units) : Math.floor(units);
  }

  let elapsedInUnits = (now.getTime() - prev.getTime()) / 1000;
  let roundedElapsed = rounded(elapsedInUnits);

  if (0 < elapsedInUnits && elapsedInUnits < 1) return "Just now";
  for (const unit of TIME_UNITS) {
    if (Math.abs(roundedElapsed) < unit.limit) {
      return timeFormatter.format(roundedElapsed, unit.unit);
    }
    elapsedInUnits /= unit.limit;
    roundedElapsed = rounded(elapsedInUnits);
  }

  return timeFormatter.format(roundedElapsed, "years");
}

export function formatPrice(priceInCents: number) {
  return (priceInCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export function formatDate(date: Date) {
  return date.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
