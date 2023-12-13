"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProductWithVariants } from "@awardrobe/db";
import { Price, ProductVariant } from "@awardrobe/prisma-types";

type ProductInfoContextValue = {
  product: ProductWithVariants;
  productOptions: Record<string, string[]>;
  variant: ProductVariant | null;
  attributes: Record<string, string>;
  prices: Price[] | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

// TODO: is this the best way to do this?
export const ProductInfoContext = createContext<ProductInfoContextValue>({
  product: {} as ProductWithVariants,
  productOptions: {},
  variant: null,
  attributes: {},
  prices: null,
  isLoading: false,
  setIsLoading: () => {},
});

type ProductInfoProviderProps = {
  product: ProductWithVariants;
  productOptions: Record<string, string[]>;
  variant: ProductVariant | null;
  attributes: Record<string, string>;
  prices: Price[] | null;
  children: React.ReactNode;
};

export function ProductInfoProvider({ children, ...props }: ProductInfoProviderProps) {
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [searchParams]);

  return (
    <ProductInfoContext.Provider value={{ ...props, isLoading, setIsLoading }}>
      {children}
    </ProductInfoContext.Provider>
  );
}

export function useProductInfo() {
  return useContext(ProductInfoContext);
}
