import { accounts } from "./accounts";
import { prices } from "./prices";
import { productNotifications } from "./product-notifications";
import { productVariants } from "./product-variants";
import { products } from "./products";
import { sessions } from "./sessions";
import { stores } from "./stores";
import { users } from "./users";
import { verificationTokens } from "./verification-tokens";

export type Account = typeof accounts.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type ProductNotification = typeof productNotifications.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type User = typeof users.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;

export type NotificationWithUser = ProductNotification & {
  user: User;
};

export type NotificationWithVariant = ProductNotification & {
  productVariant: ProductVariant;
};

export type ProductWithStoreHandle = Product & {
  store: { handle: string };
};

export type FullProduct = Product & {
  variants: ProductVariant[];
  store: Store;
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
