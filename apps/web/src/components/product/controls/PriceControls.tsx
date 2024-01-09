"use client";

import { buttonVariants } from "@ui/Button";
import { twMerge } from "tailwind-merge";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency } from "@/utils/utils";

export function PriceControls() {
  const { product, variant, prices, isPending } = useProductInfo();

  const storeName = product.store.shortenedName ?? product.store.name;
  const productUrl = variant?.productUrl;
  const lastPrice = prices?.at(-1);

  return (
    <div className="flex flex-wrap gap-3">
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
          : product.delisted
            ? "Unavailable"
            : !productUrl
              ? "Not available"
              : !lastPrice
                ? "See price"
                : `${formatCurrency(lastPrice.priceInCents)} at ${storeName}`}
      </a>
      <NotificationPopover />
    </div>
  );
}
