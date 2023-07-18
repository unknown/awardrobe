import Link from "next/link";

import { VariantAttribute } from "@awardrobe/adapters";

import { ExtendedNotification } from "@/app/(product)/profile/page";
import { DeleteNotificationButton } from "@/components/DeleteNotificationButton";

export type NotificationListProps = {
  notifications: ExtendedNotification[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  return (
    <div className="space-y-4">
      {notifications.map(({ id, productVariant }) => {
        // TODO: better types?
        const attributes = productVariant.attributes as VariantAttribute[];
        const description = attributes.map(({ value }) => value).join(" - ");

        return (
          <div key={id}>
            <Link href={`/product/${productVariant.product.id}?variantId=${productVariant.id}`}>
              <h2 className="text-lg font-medium">{productVariant.product.name}</h2>
            </Link>
            <p className="text-muted-foreground text-sm">{description}</p>
            <DeleteNotificationButton id={id} />
          </div>
        );
      })}
    </div>
  );
}
