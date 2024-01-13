"use client";

import { createContext, TransitionStartFunction, useContext, useTransition } from "react";

import { ProductVariantListingWithPrices, ProductVariantWithProduct, Public } from "@awardrobe/db";

type ProductInfoContextValue = {
  productPublicId: string;
  productOptions: Record<string, string[]>;
  variant: Public<ProductVariantWithProduct> | null;
  variants: Public<ProductVariantWithProduct>[];
  attributes: Record<string, string>;
  listings: ProductVariantListingWithPrices[];
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

// TODO: is this the best way to do this?
export const ProductInfoContext = createContext<ProductInfoContextValue>({
  productPublicId: "",
  productOptions: {},
  variant: null,
  variants: [],
  attributes: {},
  listings: [],
  isPending: false,
  startTransition: () => {},
});

type ProductInfoProviderProps = {
  productPublicId: string;
  productOptions: Record<string, string[]>;
  variant: Public<ProductVariantWithProduct> | null;
  variants: Public<ProductVariantWithProduct>[];
  attributes: Record<string, string>;
  listings: ProductVariantListingWithPrices[];
  children: React.ReactNode;
};

export function ProductInfoProvider({ children, ...props }: ProductInfoProviderProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <ProductInfoContext.Provider value={{ ...props, isPending, startTransition }}>
      {children}
    </ProductInfoContext.Provider>
  );
}

export function useProductInfo() {
  return useContext(ProductInfoContext);
}
