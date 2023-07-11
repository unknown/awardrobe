export type VariantAttribute = {
  name: string;
  value: string;
};

export type ProductPrice = {
  attributes: VariantAttribute[];
  priceInCents: number;
  inStock: boolean;
};
