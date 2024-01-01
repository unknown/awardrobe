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

export type ProductWithStore = Product & { store: Store };

export type ProductVariantWithPrice = ProductVariant & {
  latestPrice: Price | null;
};
