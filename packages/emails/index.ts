import PriceNotificationEmail, {
  PriceNotificationEmailProps,
} from "./src/emails/PriceNotification";
import SignInEmail, { SignInEmailProps } from "./src/emails/SignIn";
import StockNotificationEmail, {
  StockNotificationEmailProps,
} from "./src/emails/StockNotification";

export { StockNotificationEmail, StockNotificationEmailProps };
export { PriceNotificationEmail, PriceNotificationEmailProps };
export { SignInEmail, SignInEmailProps };

export { resend } from "./src/resend";
