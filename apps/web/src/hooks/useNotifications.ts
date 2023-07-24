import { useCallback, useState } from "react";

import { ProductNotification } from "@awardrobe/prisma-types";

import { GetNotificationsResponse } from "@/app/api/notifications/route";

export type FetchNotificationsOptions = {
  productId?: string;
  abortSignal?: AbortSignal;
};

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [notificationsData, setNotificationsData] = useState<ProductNotification[] | null>(null);

  const fetchNotifications = useCallback(async function (options: FetchNotificationsOptions) {
    const { productId, abortSignal } = options;

    setLoading(true);
    const result = await getNotifications(productId, abortSignal);
    if (!abortSignal?.aborted) {
      // TODO: handle error better
      if (result.status === "error") {
        setNotificationsData([]);
      } else {
        setNotificationsData(result.notifications);
      }
    }
    setLoading(false);
  }, []);

  const invalidateData = useCallback(() => {
    setNotificationsData([]);
  }, []);

  return {
    data: notificationsData,
    loading,
    fetchNotifications,
    invalidateData,
  };
}

async function getNotifications(productId?: string, abortSignal?: AbortSignal) {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
    signal: abortSignal,
  });
  return (await response.json()) as GetNotificationsResponse;
}
