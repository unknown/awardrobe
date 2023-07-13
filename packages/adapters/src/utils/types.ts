export type VariantAttribute = {
  name: string;
  value: string;
};

export type ProductPrice = {
  attributes: VariantAttribute[];
  priceInCents: number;
  inStock: boolean;
};

type ProductDetailsResult = {
  name: string;
  prices: ProductPrice[];
  variants: VariantAttribute[][];
};

export type StoreAdapter = {
  getProductCode: (url: string, useProxy?: boolean) => Promise<string>;
  getProductDetails: (productCode: string, useProxy?: boolean) => Promise<ProductDetailsResult>;
};
