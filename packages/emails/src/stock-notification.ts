import { render } from "@react-email/components";

import StockNotificationEmail, { StockNotificationEmailProps } from "./emails/StockNotification";

export function renderStockNotification(props: StockNotificationEmailProps) {
  return render(StockNotificationEmail(props));
}
