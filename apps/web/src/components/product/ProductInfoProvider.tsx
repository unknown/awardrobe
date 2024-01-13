"use client";

import { createContext, TransitionStartFunction, useContext, useTransition } from "react";

import { ProductVariantListingWithPrices, ProductVariantWithProduct, Public } from "@awardrobe/db";

type ProductInfoContextValue = {
  productPublicId: string;
  variants: Public<ProductVariantWithProduct>[];
  variantListings: ProductVariantListingWithPrices[];
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

// TODO: is this the best way to do this?
export const ProductInfoContext = createContext<ProductInfoContextValue>({
  productPublicId: "",
  variants: [],
  variantListings: [],
  isPending: false,
  startTransition: () => {},
});

type ProductInfoProviderProps = {
  productPublicId: string;
  variants: Public<ProductVariantWithProduct>[];
  variantListings: ProductVariantListingWithPrices[];
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
