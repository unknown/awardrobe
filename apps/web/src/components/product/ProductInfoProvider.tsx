"use client";

import { createContext, TransitionStartFunction, useContext, useTransition } from "react";

import { DateRange } from "@/utils/dates";

type ProductInfoContextValue = {
  collectionPublicId: string;
  productPublicId: string;
  productPublicIds: string[];
  attributes: Record<string, string>;
  attributesOptions: Record<string, string[]>;
  dateRange: DateRange;
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

export const ProductInfoContext = createContext<ProductInfoContextValue>({
  collectionPublicId: "",
  productPublicId: "",
  productPublicIds: [],
  attributes: {},
  attributesOptions: {},
  dateRange: "3m",
  isPending: false,
  startTransition: () => {},
});

type ProductInfoProviderProps = {
  collectionPublicId: string;
  productPublicId: string;
  productPublicIds: string[];
  attributes: Record<string, string>;
  attributesOptions: Record<string, string[]>;
  dateRange: DateRange;
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
