"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { FullProduct, Price, ProductVariant } from "@awardrobe/db";

type ProductInfoContextValue = {
  product: FullProduct;
  productOptions: Record<string, string[]>;
  variant: ProductVariant | null;
  attributes: Record<string, string>;
  prices: Price[] | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

// TODO: is this the best way to do this?
export const ProductInfoContext = createContext<ProductInfoContextValue>({
  product: {} as FullProduct,
  productOptions: {},
  variant: null,
  attributes: {},
  prices: null,
  isLoading: false,
  setIsLoading: () => {},
});

type ProductInfoProviderProps = {
  product: FullProduct;
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
    let canceled = false;
    if (!canceled) {
      setIsLoading(false);
    }
    return () => {
      canceled = true;
    };
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
