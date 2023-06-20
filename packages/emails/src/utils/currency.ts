export function formatPrice(priceInCents: number) {
  return (priceInCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}
