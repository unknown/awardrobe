export function toTitleCase(text: string) {
  return text.replace(/\w\S*/g, (substring) => {
    return substring.charAt(0).toUpperCase() + substring.slice(1).toLowerCase();
  });
}

export function dollarsToCents(value: string) {
  value = value.replace(/[$,]/g, "");
  return Math.round(parseFloat(value) * 100);
}
