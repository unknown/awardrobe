"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ProductInfoContextValue = {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export const ProductInfoContext = createContext<ProductInfoContextValue>({
  isLoading: false,
  setIsLoading: () => {},
});

export function ProductInfoProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [searchParams]);

  return (
    <ProductInfoContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </ProductInfoContext.Provider>
  );
}

export function useProductInfo() {
  return useContext(ProductInfoContext);
}
