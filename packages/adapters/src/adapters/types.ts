export const Brands = ["uniqlo", "abercrombie", "zara", "jcrew", "levis"] as const;
export type Brand = (typeof Brands)[number];

export type PriceDatum = {
  timestamp: Date;
  priceInCents: number;
  inStock: boolean;
};

export type VariantAttribute = {
  name: string;
  value: string;
};

export type VariantDetails = {
  attributes: VariantAttribute[];
  productUrl: string;
  price: PriceDatum;
};

export type ProductDetails = {
  name: string;
  productId: string;
  variants: VariantDetails[];
  description: string | null;
  imageUrl: string | null;
};

export type ListingDetails = {
  brand: Brand;
  collectionId: string;
  products: ProductDetails[];
};

export interface StoreAdapter {
  urlRegex: RegExp;
  storeHandle: string;
  // TODO: create pagination interface?
  getListingIds: (limit?: number) => Promise<Set<string>>;
  getListingId: (url: string) => Promise<string>;
  getListingDetails: (externalListingId: string) => Promise<ListingDetails>;
}
