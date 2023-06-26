import PriceNotificationEmail, {
  PriceNotificationEmailProps,
} from "./src/emails/PriceNotification";
import StockNotificationEmail, {
  StockNotificationEmailProps,
} from "./src/emails/StockNotification";

export * from "@react-email/render";

export { StockNotificationEmail, StockNotificationEmailProps };
export { PriceNotificationEmail, PriceNotificationEmailProps };
