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

export type ProductDetails = {
  name: string;
  variants: VariantInfo[];
  description?: string;
  imageUrl?: string;
};

export interface StoreAdapter {
  urlRegex: RegExp;
  storeHandle: string;
  // TODO: create pagination interface?
  getProducts: (limit?: number) => Promise<Set<string>>;
  getProductCode: (url: string) => Promise<string | null>;
  getProductDetails: (productCode: string) => Promise<ProductDetails>;
}
