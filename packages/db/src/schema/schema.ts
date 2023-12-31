import * as accounts from "./accounts";
import * as prices from "./prices";
import * as productNotifications from "./product-notifications";
import * as productVariants from "./product-variants";
import * as products from "./products";
import * as sessions from "./sessions";
import * as stores from "./stores";
import * as users from "./users";
import * as verificationTokens from "./verification-tokens";

export const schema = {
  ...accounts,
  ...sessions,
  ...users,
  ...verificationTokens,
  ...stores,
  ...products,
  ...prices,
  ...productVariants,
  ...productNotifications,
};
