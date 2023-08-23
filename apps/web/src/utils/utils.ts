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

  let elapsedInUnits = (prev.getTime() - now.getTime()) / 1000;
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

export function formatCurrency(priceInCents: number) {
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

export function shallowEquals(object1: any, object2: any) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  return keys1.every((key) => object1[key] === object2[key]);
}
