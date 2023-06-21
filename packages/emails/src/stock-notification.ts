import { render } from "@react-email/render";

import StockNotificationEmail, { StockNotificationEmailProps } from "./emails/StockNotification";

export function renderStockNotification(props: StockNotificationEmailProps) {
  return render(StockNotificationEmail(props));
}
