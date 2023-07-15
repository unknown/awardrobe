import { VariantInfo } from "@awardrobe/adapters";
import { Prisma } from "@awardrobe/prisma-types";

const variantWithPrice = Prisma.validator<Prisma.ProductVariantArgs>()({
  include: { prices: { take: 1, orderBy: { timestamp: "desc" } } },
});
type VariantWithPrice = Prisma.ProductVariantGetPayload<typeof variantWithPrice>;

const extendedProduct = Prisma.validator<Prisma.ProductArgs>()({
  include: { variants: variantWithPrice, store: true },
});
export type ExtendedProduct = Prisma.ProductGetPayload<typeof extendedProduct>;

export type ExtendedVariantInfo = VariantInfo & {
  productVariant: VariantWithPrice;
};

export type StoreMonitor = {
  pingProduct: (product: ExtendedProduct) => Promise<void>;
};
