import { render } from "@react-email/components";

import DelistedNotificationEmail, {
  DelistedNotificationEmailProps,
} from "./emails/DelistedNotification";
import PriceNotificationEmail, { PriceNotificationEmailProps } from "./emails/PriceNotification";
import SignInEmail, { SignInEmailProps } from "./emails/SignIn";
import StockNotificationEmail, { StockNotificationEmailProps } from "./emails/StockNotification";

export { DelistedNotificationEmail, type DelistedNotificationEmailProps };
export { StockNotificationEmail, type StockNotificationEmailProps };
export { PriceNotificationEmail, type PriceNotificationEmailProps };
export { SignInEmail, type SignInEmailProps };

export * from "./resend";
export { render };
