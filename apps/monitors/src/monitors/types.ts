import { VariantInfo } from "@awardrobe/adapters";
import { Product, ProductVariant } from "@awardrobe/db";

export type VariantFlags = {
  isOutdated: boolean;
  hasPriceDropped: boolean;
  hasRestocked: boolean;
};

export type UpdateVariantCallback = (options: {
  product: Product;
  variantInfo: VariantInfo;
  productVariant: ProductVariant;
}) => Promise<void>;
