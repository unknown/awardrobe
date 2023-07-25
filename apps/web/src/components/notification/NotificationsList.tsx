"use client";

import { useEffect } from "react";
import Link from "next/link";

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
          <div key={id} className="flex items-center gap-3">
            <div>
              <Link href={`/product/${productVariant.product.id}?variantId=${productVariant.id}`}>
                <h2 className="text-lg font-medium">{productVariant.product.name}</h2>
              </Link>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            <DeleteNotificationButton
              onNotificationDelete={() => {
                return removeNotification({ notificationId: id });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
