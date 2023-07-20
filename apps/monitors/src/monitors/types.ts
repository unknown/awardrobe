import { VariantInfo } from "@awardrobe/adapters";
import { Prisma, ProductVariant } from "@awardrobe/prisma-types";

const extendedProduct = Prisma.validator<Prisma.ProductArgs>()({
  include: { variants: true, store: true },
});
export type ExtendedProduct = Prisma.ProductGetPayload<typeof extendedProduct>;

export type VariantInfoWithVariant = VariantInfo & {
  productVariant: ProductVariant;
};

export type PartialPrice = {
  timestamp: Date;
  priceInCents: number;
  inStock: boolean;
};
