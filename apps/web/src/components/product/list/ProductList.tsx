import Link from "next/link";
import { Bell } from "@icons/Bell";
import { getServerSession } from "next-auth";

import { findNotificationsByUser } from "@awardrobe/db";
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
        return (
          <Link key={product.id} href={`/product/${product.id}`} prefetch={false}>
            <div className="relative flex h-full flex-col gap-1 rounded-md border p-4 md:p-3">
              {hasNotification ? (
                <div className="absolute right-4 top-4 md:right-3 md:top-3">
                  <Bell className="h-4 w-4" strokeWidth={2} />
                </div>
              ) : null}
              <p className="text-muted-foreground text-sm">{product.storeName}</p>
              <p>{product.name}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
