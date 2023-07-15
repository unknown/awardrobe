export type VariantAttribute = {
  name: string;
  value: string;
};

export type VariantInfo = {
  productUrl: string;
  attributes: VariantAttribute[];
  priceInCents: number;
  inStock: boolean;
};

export type StoreAdapter = {
  urlPrefixes: string[];
  storeHandle: string;
  // TODO: create pagination interface?
  getProducts: (limit?: number, useProxy?: boolean) => Promise<string[]>;
  getProductCode: (url: string, useProxy?: boolean) => Promise<string>;
  getProductDetails: (
    productCode: string,
    useProxy?: boolean,
  ) => Promise<{
    name: string;
    variants: VariantInfo[];
  }>;
};
