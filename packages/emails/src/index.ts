import { render } from "jsx-email";

import PriceNotificationEmail, { PriceNotificationEmailProps } from "./emails/PriceNotification";
import SignInEmail, { SignInEmailProps } from "./emails/SignIn";
import StockNotificationEmail, { StockNotificationEmailProps } from "./emails/StockNotification";

export { StockNotificationEmail, type StockNotificationEmailProps };
export { PriceNotificationEmail, type PriceNotificationEmailProps };
export { SignInEmail, type SignInEmailProps };

export { resend } from "./resend";
export { render };
