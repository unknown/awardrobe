import { schema } from "./schema";

export type Account = typeof schema.accounts.$inferSelect;
export type Brand = typeof schema.brands.$inferSelect;
export type Collection = typeof schema.collections.$inferSelect;
export type Price = typeof schema.prices.$inferSelect;
export type ProductNotification = typeof schema.productNotifications.$inferSelect;
export type ProductVariantListing = typeof schema.productVariantListings.$inferSelect;
export type ProductVariant = typeof schema.productVariants.$inferSelect;
export type Product = typeof schema.products.$inferSelect;
export type Session = typeof schema.sessions.$inferSelect;
export type StoreListing = typeof schema.storeListings.$inferSelect;
export type Store = typeof schema.stores.$inferSelect;
export type User = typeof schema.users.$inferSelect;
export type VerificationToken = typeof schema.verificationTokens.$inferSelect;

export type NotificationWithUser = ProductNotification & {
  user: User;
};

export type NotificationWithVariant = ProductNotification & {
  productVariant: ProductVariant;
};

export type ProductWithBrand = Product & {
  brand: Brand;
};

export type FullProduct = Product & {
  variants: ProductVariant[];
  brand: Brand;
};

export type ProductVariantWithPrice = ProductVariant & {
  latestPrice: Price | null;
};

export type PublicPrice = Omit<Price, "id" | "productVariantId">;
export type PublicProductNotification = Omit<
  ProductNotification,
  "id" | "productVariantId" | "productId"
>;
export type PublicProductVariant = Omit<ProductVariant, "id" | "productId" | "latestPriceId">;
export type PublicProduct = Omit<Product, "id" | "storeId">;
export type PublicStore = Omit<Store, "id">;

type ExcludedBuiltinTypes = Date | Function | Promise<any> | RegExp;

// substitute A for B in T:
// if T is a built-in type,
//   then return T
//   otherwise, if T is an array,
//     then substitute the array element type recursively
//     otherwise, if T is a subtype of A,
//       then substitute A for B and substitute the rest of the type recursively
//       otherwise, if T is an object,
//         then substitute the object property types recursively
//         otherwise, return T
type SubstituteType<T, A, B> = T extends ExcludedBuiltinTypes
  ? T
  : T extends (infer U)[]
    ? SubstituteType<U, A, B>[]
    : T extends A
      ? {
          [K in keyof B | Exclude<keyof T, keyof A>]: K extends keyof B
            ? B[K]
            : K extends keyof T
              ? SubstituteType<T[K], A, B>
              : never;
        }
      : T extends object
        ? { [K in keyof T]: SubstituteType<T[K], A, B> }
        : T;

// TODO: big mess + need tests
type SubstitutePrice<T> = SubstituteType<T, Price, PublicPrice>;
type SubstituteProductNotification<T> = SubstituteType<
  T,
  ProductNotification,
  PublicProductNotification
>;
type SubstituteProductVariant<T> = SubstituteType<T, ProductVariant, PublicProductVariant>;
type SubstituteProduct<T> = SubstituteType<T, Product, PublicProduct>;
type SubstituteStore<T> = SubstituteType<T, Store, PublicStore>;

export type Public<T> = SubstitutePrice<
  SubstituteProductNotification<SubstituteProductVariant<SubstituteProduct<SubstituteStore<T>>>>
>;
