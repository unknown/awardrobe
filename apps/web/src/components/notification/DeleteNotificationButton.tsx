import { Button } from "@ui/Button";
import { toast } from "sonner";

import { ProductNotification, Public } from "@awardrobe/db";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { api } from "@/trpc/react";

type DeleteNotificationButtonProps = {
  notification: Public<ProductNotification>;
};

export function DeleteNotificationButton({ notification }: DeleteNotificationButtonProps) {
  const { product } = useProductInfo();

  const utils = api.useUtils();
  const removeNotification = api.notifications.delete.useMutation({
    onSuccess: async () => {
      await utils.notifications.list.invalidate({ productPublicId: product.publicId });
    },
    onError: (err) => {
      toast.error(
        err.data?.code === "UNAUTHORIZED"
          ? "You must be logged in to delete a notification"
          : "Failed to delete post",
      );
    },
  });

  return (
    <Button
      variant="destructive"
      onClick={async () => {
        removeNotification.mutate({ notificationPublicId: notification.publicId });
      }}
      disabled={removeNotification.isPending}
    >
      Remove
    </Button>
  );
}
