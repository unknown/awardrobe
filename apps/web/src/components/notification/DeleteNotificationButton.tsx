"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/Button";

import { DeleteNotificationResponse } from "@/app/api/notifications/delete/route";

type DeleteNotificationButtonProps = {
  id: string;
};

export function DeleteNotificationButton({ id }: DeleteNotificationButtonProps) {
  const router = useRouter();
  return (
    <Button
      onClick={async () => {
        const result = await deleteNotification(id);
        if (result.status === "success") {
          router.refresh();
        }
      }}
    >
      Remove notification
    </Button>
  );
}

// TODO: extract this somehow
async function deleteNotification(notificationId: string) {
  const response = await fetch("/api/notifications/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId }),
  });
  return (await response.json()) as DeleteNotificationResponse;
}
