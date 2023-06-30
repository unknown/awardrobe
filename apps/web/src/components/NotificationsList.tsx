"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

import { Prisma } from "@awardrobe/prisma-types";

import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";

const extendedNotification = Prisma.validator<Prisma.ProductNotificationArgs>()({
  include: {
    productVariant: {
      include: {
        product: true,
      },
    },
  },
});
type ExtendedNotification = Prisma.ProductNotificationGetPayload<typeof extendedNotification>;

export type NotificationListProps = {
  initialNotifications: ExtendedNotification[];
};
export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  return (
    <div className="space-y-4">
      {notifications.map(({ id, productId, productVariant }) => {
        const { style, size } = productVariant;
        return (
          <div key={id}>
            <Link href={`/product/${productId}?style=${style}&size=${size}`}>
              <h2 className="text-lg font-medium">{productVariant.product.name}</h2>
            </Link>
            <p className="text-muted-foreground text-sm">
              {style} - {size}
            </p>
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
