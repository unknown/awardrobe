"use client";

import { useEffect } from "react";

import { VariantAttribute } from "@awardrobe/adapters";

import { DeleteNotificationButton } from "@/components/notification/DeleteNotificationButton";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationList() {
  const { data: notifications, fetchNotifications, removeNotification } = useNotifications();

  useEffect(() => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    fetchNotifications({ abortSignal });
    return () => {
      abortController.abort();
    };
  }, [fetchNotifications]);

  return (
    <div className="space-y-4">
      {notifications === null && "Loading..."}
      {notifications?.length === 0 && "No notifications"}
      {notifications?.map(({ id, productVariant }) => {
        // TODO: better types?
        const attributes = productVariant.attributes as VariantAttribute[];
        const description = attributes.map(({ value }) => value).join(" - ");

        return (
          <div key={id} className="flex items-center gap-2">
            <p>{description}</p>
            <DeleteNotificationButton
              onNotificationDelete={() => {
                removeNotification({ notificationId: id });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
