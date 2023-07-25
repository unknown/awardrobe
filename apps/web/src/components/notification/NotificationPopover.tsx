import { Fragment, useEffect } from "react";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/Popover";

import { VariantAttribute } from "@awardrobe/adapters";
import { ProductVariant } from "@awardrobe/prisma-types";

import { AddNotificationDialog } from "@/components/notification/AddNotificationDialog";
import { DeleteNotificationButton } from "@/components/notification/DeleteNotificationButton";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency } from "@/utils/utils";

type NotificationPopoverProps = {
  productId: string;
  productOptions: Record<string, string[]>;
  variants: ProductVariant[];
};

export function NotificationPopover({
  productId,
  productOptions,
  variants,
}: NotificationPopoverProps) {
  const {
    data: notifications,
    fetchNotifications,
    addNotification,
    removeNotification,
  } = useNotifications();

  useEffect(() => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    fetchNotifications({ productId, abortSignal });
    return () => {
      abortController.abort();
    };
  }, [fetchNotifications, productId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Bell />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-muted-foreground text-sm">Manage your product alerts.</p>
          </div>
          {notifications === null && "Loading..."}
          {notifications?.length === 0 && "No notifications"}
          <div className="grid grid-cols-[1fr_max-content_max-content] items-center gap-2">
            {notifications?.map((notification) => {
              const attributes = notification.productVariant.attributes as VariantAttribute[];
              const description = attributes.map(({ value }) => value).join(" - ");
              return (
                <Fragment key={notification.id}>
                  <p>{description}</p>
                  <p>{formatCurrency(notification.priceInCents ?? 0)}</p>
                  <DeleteNotificationButton
                    onNotificationDelete={() => {
                      return removeNotification({ notificationId: notification.id });
                    }}
                  />
                </Fragment>
              );
            })}
          </div>
          <AddNotificationDialog
            productOptions={productOptions}
            variants={variants}
            onNotificationCreate={(options) => {
              return addNotification(options);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
