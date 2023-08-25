import Link from "next/link";
import { redirect } from "next/navigation";
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
    <section className="container max-w-4xl space-y-4">
      <div className="flex gap-3">
        <Link href="/browse" className="text-lg font-medium">
          Browse All
        </Link>
        <h1 className="cursor-pointer text-lg font-medium underline underline-offset-2">
          Following
        </h1>
      </div>
      <ProductList
        products={followingProducts.map(({ id, name, store }) => ({
          id,
          name,
          storeName: store.name,
        }))}
      />
    </section>
  );
}
