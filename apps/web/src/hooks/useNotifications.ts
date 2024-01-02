import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { NotificationWithVariant, Public } from "@awardrobe/db";

import {
  AddNotificationRequest,
  AddNotificationResponse,
} from "@/app/api/notifications/create/route";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { GetNotificationsResponse } from "@/app/api/notifications/route";

export type FetchNotificationsOptions = {
  productPublicId: string;
  abortSignal?: AbortSignal;
};

export type CreateNotificationOptions = {
  variantPublicId: string;
  priceInCents: number;
  priceDrop: boolean;
  restock: boolean;
};

export type DeleteNotificationOptions = {
  notificationPublicId: string;
};

export function useNotifications() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [notificationsData, setNotificationsData] = useState<
    Public<NotificationWithVariant>[] | null
  >(null);

  const fetchNotifications = useCallback(async function (options: FetchNotificationsOptions) {
    setLoading(true);
    const result = await getNotifications(options);
    if (!options.abortSignal?.aborted) {
      // TODO: handle error better
      if (result.status === "error") {
        setNotificationsData([]);
      } else {
        setNotificationsData(result.notifications);
      }
    }
    setLoading(false);
  }, []);

  const addNotification = useCallback(
    async function (options: CreateNotificationOptions) {
      const result = await createNotification(options);
      if (result.status === "success") {
        setNotificationsData((notifications) => [...(notifications ?? []), result.notification]);
        router.refresh();
        return true;
      }
      return false;
    },
    [router],
  );

  const removeNotification = useCallback(
    async function (options: DeleteNotificationOptions) {
      const result = await deleteNotification(options);
      if (result.status === "success") {
        setNotificationsData(
          (notifications) =>
            notifications?.filter(
              (notification) => notification.publicId !== options.notificationPublicId,
            ) ?? [],
        );
        router.refresh();
        return true;
      }
      return false;
    },
    [router],
  );

  const invalidateData = useCallback(() => {
    setNotificationsData([]);
  }, []);

  return {
    data: notificationsData,
    loading,
    fetchNotifications,
    addNotification,
    removeNotification,
    invalidateData,
  };
}

async function getNotifications({ productPublicId, abortSignal }: FetchNotificationsOptions) {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productPublicId }),
    signal: abortSignal,
  });
  return (await response.json()) as GetNotificationsResponse;
}

async function createNotification({
  variantPublicId,
  priceDrop,
  priceInCents,
  restock,
}: CreateNotificationOptions) {
  const body: AddNotificationRequest = {
    variantPublicId,
    priceInCents,
    priceDrop: priceDrop,
    restock: restock,
  };
  const response = await fetch("/api/notifications/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as AddNotificationResponse;
}

async function deleteNotification({ notificationPublicId }: DeleteNotificationOptions) {
  const response = await fetch("/api/notifications/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationPublicId }),
  });
  return (await response.json()) as DeleteNotificationResponse;
}
