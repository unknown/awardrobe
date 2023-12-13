"use client";

import { ProductWithVariants } from "@awardrobe/db";
import { Price, ProductVariant } from "@awardrobe/prisma-types";

import { NotificationPopover } from "@/components/notification/NotificationPopover";
import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency } from "@/utils/utils";

type PriceControlsProps = {
  product: ProductWithVariants;
  variant: ProductVariant | null;
  lastPrice: Price | null;
  productOptions: Record<string, string[]>;
  initialAttributes: Record<string, string>;
};

export function PriceControls({
  product,
  variant,
  lastPrice,
  productOptions,
  initialAttributes,
}: PriceControlsProps) {
  const { isLoading } = useProductInfo();

  const storeName = product.store.shortenedName ?? product.store.name;
  const productUrl = variant?.productUrl;

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
      <NotificationPopover
        productId={product.id}
        productOptions={productOptions}
        variants={product.variants}
        attributes={initialAttributes}
        priceInCents={lastPrice?.priceInCents ?? null}
      />
    </div>
  );
}
