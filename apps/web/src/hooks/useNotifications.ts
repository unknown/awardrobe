import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AddNotificationRequest,
  AddNotificationResponse,
} from "@/app/api/notifications/create/route";
import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";
import { ExtendedNotification, GetNotificationsResponse } from "@/app/api/notifications/route";

export type FetchNotificationsOptions = {
  productId?: string;
  abortSignal?: AbortSignal;
};

export type CreateNotificationOptions = {
  variantId: string;
  priceInCents: number | null;
  priceDrop: boolean;
  restock: boolean;
};

export type DeleteNotificationOptions = {
  notificationId: string;
};

export function useNotifications() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [notificationsData, setNotificationsData] = useState<ExtendedNotification[] | null>(null);

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

  const addNotification = useCallback(async function (options: CreateNotificationOptions) {
    const result = await createNotification(options);
    if (result.status === "success") {
      setNotificationsData((notifications) => [...(notifications ?? []), result.notification]);
      router.refresh();
      return true;
    }
    return false;
  }, []);

  const removeNotification = useCallback(async function (options: DeleteNotificationOptions) {
    const result = await deleteNotification(options);
    if (result.status === "success") {
      setNotificationsData(
        (notifications) =>
          notifications?.filter((notification) => notification.id !== options.notificationId) ?? [],
      );
      router.refresh();
      return true;
    }
    return false;
  }, []);

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

async function getNotifications({ productId, abortSignal }: FetchNotificationsOptions) {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
    signal: abortSignal,
  });
  return (await response.json()) as GetNotificationsResponse;
}

async function createNotification({
  variantId,
  priceDrop,
  priceInCents,
  restock,
}: CreateNotificationOptions) {
  const body: AddNotificationRequest = {
    variantId,
    priceInCents: priceInCents ?? undefined,
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

async function deleteNotification({ notificationId }: DeleteNotificationOptions) {
  const response = await fetch("/api/notifications/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId }),
  });
  return (await response.json()) as DeleteNotificationResponse;
}
