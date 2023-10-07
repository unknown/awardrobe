import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@ui/Skeleton";
import { getServerSession } from "next-auth";

import { prisma } from "@awardrobe/prisma-types";

import { ProductList } from "@/components/product/ProductList";
import { authOptions } from "@/utils/auth";

export default async function FollowingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const followingProducts = await prisma.product.findMany({
    where: { variants: { some: { notifications: { some: { userId: session.user.id } } } } },
    include: { store: true },
  });

  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          <Skeleton className="h-[48px]" />
          <Skeleton className="h-[48px]" />
          <Skeleton className="h-[48px]" />
          <Skeleton className="h-[48px]" />
          <Skeleton className="h-[48px]" />
          <Skeleton className="h-[48px]" />
          <Skeleton className="h-[48px]" />
        </div>
      }
    >
      <ProductList
        products={followingProducts.map(({ id, name, store }) => ({
          id,
          name,
          storeName: store.name,
        }))}
      />
    </Suspense>
  );
}
