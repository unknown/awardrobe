import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@ui/Skeleton";
import { getServerSession } from "next-auth";

import { FollowingProductList } from "@/components/product/list/FollowingProductList";
import { authOptions } from "@/utils/auth";

export default async function FollowingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[48px]" />
          ))}
        </div>
      }
    >
      <FollowingProductList userId={session.user.id} />
    </Suspense>
  );
}
