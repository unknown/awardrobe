import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

export default async function Home() {
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
    <section className="container space-y-2">
      <h1 className="text-xl font-bold">Notifications</h1>
      <div className="flex flex-col gap-1">
        {notifications.map((notification) => (
          <div>
            <h2 className="text-lg font-medium">{notification.productVariant.product.name}</h2>
            {notification.productVariant.style} {notification.productVariant.size}
          </div>
        ))}
      </div>
    </section>
  );
}
