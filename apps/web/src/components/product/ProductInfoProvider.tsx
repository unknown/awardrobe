"use client";

import { createContext, TransitionStartFunction, useContext, useTransition } from "react";

import { FullProduct, Price, ProductVariant, Public } from "@awardrobe/db";

type ProductInfoContextValue = {
  product: Public<FullProduct>;
  productOptions: Record<string, string[]>;
  variant: Public<ProductVariant> | null;
  attributes: Record<string, string>;
  prices: Public<Price>[] | null;
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

// TODO: is this the best way to do this?
export const ProductInfoContext = createContext<ProductInfoContextValue>({
  product: {} as Public<FullProduct>,
  productOptions: {},
  variant: null,
  attributes: {},
  prices: null,
  isPending: false,
  startTransition: () => {},
});

type ProductInfoProviderProps = {
  product: Public<FullProduct>;
  productOptions: Record<string, string[]>;
  variant: Public<ProductVariant> | null;
  attributes: Record<string, string>;
  prices: Public<Price>[] | null;
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
