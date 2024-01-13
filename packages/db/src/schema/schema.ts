import * as accounts from "./accounts";
import * as brands from "./brands";
import * as collections from "./collections";
import * as prices from "./prices";
import * as productNotifications from "./product-notifications";
import * as productVariantListings from "./product-variant-listings";
import * as productVariants from "./product-variants";
import * as products from "./products";
import * as sessions from "./sessions";
import * as storeListings from "./store-listings";
import * as stores from "./stores";
import * as users from "./users";
import * as verificationTokens from "./verification-tokens";

export const schema = {
  ...accounts,
  ...brands,
  ...collections,
  ...prices,
  ...productNotifications,
  ...productVariantListings,
  ...productVariants,
  ...products,
  ...sessions,
  ...storeListings,
  ...stores,
  ...users,
  ...verificationTokens,
};
