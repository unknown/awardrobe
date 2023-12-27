import Link from "next/link";
import { Bell } from "@icons/Bell";
import { getServerSession } from "next-auth";

import { findNotificationsByUser } from "@awardrobe/db";
import { getProductPath } from "@awardrobe/media-store";
import { Product } from "@awardrobe/meilisearch-types";

import { authOptions } from "@/utils/auth";

export type ProductListProps = {
  products: Product[];
};

export async function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-center">No matching products found.</p>;
  }

  const session = await getServerSession(authOptions);
  const notifications = session
    ? await findNotificationsByUser({
        userId: session.user.id,
        productIds: products.map((product) => product.id),
      })
    : [];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => {
        const hasNotification = notifications.some(
          (notification) => notification.productVariant.productId === product.id,
        );

        const mediaStorePath = getProductPath(product.id);
        const mediaUrl = new URL(mediaStorePath, process.env.NEXT_PUBLIC_MEDIA_STORE_URL).href;

        return (
          <div className="relative rounded-md border p-4 md:p-3">
            <Link key={product.id} href={`/product/${product.id}`} prefetch={false}>
              <img className="rounded-sm" src={mediaUrl} alt={`Image of ${product.name}`} />
            </Link>
            {hasNotification ? (
              <div className="absolute right-5 top-5 m-0 rounded-full bg-white p-1.5 text-black shadow">
                <Bell className="h-4 w-4" strokeWidth={2} />
              </div>
            ) : null}
            <div className="mt-3">
              <p className="text-muted-foreground text-sm">{product.storeName}</p>
              <p>{product.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
