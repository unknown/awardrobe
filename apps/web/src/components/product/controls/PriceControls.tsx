"use client";

import { buttonVariants } from "@ui/Button";
import { twMerge } from "tailwind-merge";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency } from "@/utils/utils";

export function PriceControls() {
  const { listings, isPending } = useProductInfo();

  const cheapestListing = listings.reduce((cheapest, listing) => {
    const cheapestPrice = cheapest?.prices.at(-1)?.priceInCents;
    const listingPrice = listing.prices.at(-1)?.priceInCents;
    if (
      !cheapest ||
      !cheapestPrice ||
      (listingPrice && cheapestPrice && listingPrice < cheapestPrice)
    ) {
      return listing;
    }
    return cheapest;
  }, listings[0]);

  const productUrl = cheapestListing?.productUrl;
  const storeName = cheapestListing?.storeListing.store.name;
  const isUnavailable = !cheapestListing?.active || !productUrl;
  const lastPrice = cheapestListing?.prices.at(-1);

  return (
    <a
      className={twMerge(
        buttonVariants({ variant: "primary" }),
        "text-md bg-sky-500 font-medium text-white hover:bg-sky-600",
      )}
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {isPending
        ? "Loading..."
        : isUnavailable
          ? "Unavailable"
          : lastPrice
            ? `${formatCurrency(lastPrice.priceInCents)} at ${storeName}`
            : "See price"}
    </a>
  );
}
