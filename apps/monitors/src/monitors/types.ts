import { VariantInfo } from "@awardrobe/adapters";
import { ProductWithLatestPrice } from "@awardrobe/db";
import { ProductVariant } from "@awardrobe/prisma-types";

export type VariantFlags = {
  isOutdated: boolean;
  hasPriceDropped: boolean;
  hasRestocked: boolean;
};

export type UpdateVariantCallback = (options: {
  product: ProductWithLatestPrice;
  variantInfo: VariantInfo;
  productVariant: ProductVariant;
}) => Promise<void>;
