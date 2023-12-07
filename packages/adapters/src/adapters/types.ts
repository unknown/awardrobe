export type VariantAttribute = {
  name: string;
  value: string;
};

export type VariantInfo = {
  timestamp: Date;
  productUrl: string;
  attributes: VariantAttribute[];
  priceInCents: number;
  inStock: boolean;
};

export interface StoreAdapter {
  urlRegex: RegExp;
  storeHandle: string;
  // TODO: create pagination interface?
  getProducts: (limit?: number) => Promise<string[]>;
  getProductCode: (url: string) => Promise<string | null>;
  getProductDetails: (productCode: string) => Promise<{
    name: string;
    variants: VariantInfo[];
  }>;
}
