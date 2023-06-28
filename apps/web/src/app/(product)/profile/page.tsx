import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect("/login");
  }

  const notifications = await prisma.productNotification.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      productVariant: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <section className="container space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Email</h2>
        <div className="space-y-6">{session.user.email}</div>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Notifications</h2>
        <div className="space-y-3">
          {notifications.map(({ id, productId, productVariant }) => {
            const { style, size } = productVariant;
            return (
              <div key={id}>
                <Link href={`/product/${productId}?style=${style}&size=${size}`}>
                  <h2 className="text-lg font-medium">{productVariant.product.name}</h2>
                  <p className="text-muted-foreground text-sm">
                    {style} - {size}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
