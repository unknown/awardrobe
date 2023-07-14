"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

import { VariantAttribute } from "@awardrobe/adapters";

import { ExtendedNotification } from "@/app/(product)/profile/page";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";

export type NotificationListProps = {
  initialNotifications: ExtendedNotification[];
};
export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  return (
    <div className="space-y-4">
      {notifications.map(({ id, productVariant }) => {
        // TODO: better types?
        const attributes = productVariant.attributes as VariantAttribute[];
        const description = attributes.map(({ value }) => value).join(" - ");

        return (
          <div key={id}>
            <Link href={`/product/${productVariant.product.id}`}>
              <h2 className="text-lg font-medium">{productVariant.product.name}</h2>
            </Link>
            <p className="text-muted-foreground text-sm">{description}</p>
            <Button
              className="mt-1"
              onClick={async () => {
                const result = await deleteNotification(id);
                if (result.status === "success") {
                  setNotifications((notifications) =>
                    [...notifications].filter((n) => n.id !== id),
                  );
                }
              }}
            >
              Remove notification
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// TODO: extract this somehow
async function deleteNotification(notificationId: string) {
  const response = await fetch("/api/notifications/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId,
    }),
  });
  return (await response.json()) as DeleteNotificationResponse;
}
