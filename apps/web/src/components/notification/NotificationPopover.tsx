"use client";

import { Fragment } from "react";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/Popover";

import { AddNotificationDialog } from "@/components/notification/AddNotificationDialog";
import { DeleteNotificationButton } from "@/components/notification/DeleteNotificationButton";
import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { api } from "@/trpc/react";
import { formatCurrency } from "@/utils/utils";

export function NotificationPopover() {
  const { productPublicId } = useProductInfo();

  const listNotifications = api.notifications.list.useQuery({ productPublicId });
  const notifications = listNotifications.data;

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
          {listNotifications.isLoading
            ? "Loading..."
            : notifications?.length === 0
              ? "No notifications"
              : null}
          <div className="grid grid-cols-[1fr_max-content_max-content] items-center gap-2">
            {notifications?.map((notification) => {
              const description = notification.productVariant.attributes
                .map(({ value }) => value)
                .join(" - ");
              return (
                <Fragment key={notification.publicId}>
                  <p>{description}</p>
                  <p>{formatCurrency(notification.priceInCents ?? 0)}</p>
                  <DeleteNotificationButton notification={notification} />
                </Fragment>
              );
            })}
          </div>
          <AddNotificationDialog />
        </div>
      </PopoverContent>
    </Popover>
  );
}
