import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

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
    <section className="container space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>
      <div className="space-y-6">
        {notifications.map(({ id, productId, productVariant }) => (
          <div key={id} className="space-y-2">
            <h2 className="text-lg font-medium">{productVariant.product.name}</h2>
            <Link href={`/product/${productId}`} className="text-sky-600">
              View product details
            </Link>
            <p>
              Style: {productVariant.style}, Size: {productVariant.size}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
