"use client";

import { Fragment, useEffect } from "react";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/Popover";

import { AddNotificationDialog } from "@/components/notification/AddNotificationDialog";
import { DeleteNotificationButton } from "@/components/notification/DeleteNotificationButton";
import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency } from "@/utils/utils";

export function NotificationPopover() {
  const { product } = useProductInfo();

  const {
    data: notifications,
    fetchNotifications,
    addNotification,
    removeNotification,
  } = useNotifications();

  useEffect(() => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    fetchNotifications({ abortSignal, productPublicId: product.publicId });
    return () => {
      abortController.abort();
    };
  }, [fetchNotifications, product.publicId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon">
          <Bell />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-muted-foreground text-sm">Manage your product alerts.</p>
          </div>
          {notifications === null
            ? "Loading..."
            : notifications.length === 0
              ? "No notifications"
              : null}
          <div className="grid grid-cols-[1fr_max-content_max-content] items-center gap-2">
            {notifications?.map(({ publicId, priceInCents, productVariant }) => {
              const description = productVariant.attributes.map(({ value }) => value).join(" - ");
              return (
                <Fragment key={publicId}>
                  <p>{description}</p>
                  <p>{formatCurrency(priceInCents ?? 0)}</p>
                  <DeleteNotificationButton
                    onNotificationDelete={() =>
                      removeNotification({ notificationPublicId: publicId })
                    }
                  />
                </Fragment>
              );
            })}
          </div>
          <AddNotificationDialog onNotificationCreate={addNotification} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
