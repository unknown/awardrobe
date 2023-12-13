"use client";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency } from "@/utils/utils";

export function PriceControls() {
  const { product, variant, prices, isLoading } = useProductInfo();

  const storeName = product.store.shortenedName ?? product.store.name;
  const productUrl = variant?.productUrl;
  const lastPrice = prices?.at(-1);

  return (
    <div className="flex flex-wrap gap-3">
      <a
        className="text-md inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600"
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {isLoading
          ? "Loading..."
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
