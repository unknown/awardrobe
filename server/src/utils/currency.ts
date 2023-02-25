export const dollarsToCents = (value: string) => {
  value = value.replace(/[$,]/g, "");
  return Math.round(parseFloat(value) * 100);
};
