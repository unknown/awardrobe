import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import * as accounts from "./schema/accounts";
import * as prices from "./schema/prices";
import * as productNotifications from "./schema/product-notifications";
import * as productVariants from "./schema/product-variants";
import * as products from "./schema/products";
import * as sessions from "./schema/sessions";
import * as stores from "./schema/stores";
import * as users from "./schema/users";
import * as verificationTokens from "./schema/verification-tokens";

export * from "./product";
export * from "./price";
export * from "./product-variant";
export * from "./product-notification";
export * from "./store";

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

const connection = connect({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(connection, { schema });
