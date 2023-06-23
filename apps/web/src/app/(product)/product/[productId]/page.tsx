import { Product, ProductVariant } from "@awardrobe/prisma-types";

import { ProductInfo } from "@/components/ProductInfo";
import { prisma } from "@/utils/prisma";
import Link from "next/link";
import { Button } from "@ui/Button";
import { Fragment } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

type ProductPageProps = {
  params: { productId: string };
};

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      variants: true,
    },
  });

  if (!product) {
    return (
      <Fragment>
        <section className="container space-y-2">
          <h1 className="text-2xl font-medium">Product not found</h1>
          <p>The product you&apos;re looking couldn&apos;t be found</p>
          <div>
            <Link href="/">
              <Button>Go home</Button>
            </Link>
          </div>
        </section>
      </Fragment>
    );
  }

  const session = await getServerSession(authOptions);

  const notifications = session?.user.id
    ? await prisma.productNotification.findMany({
        where: {
          userId: session.user.id,
          productId: product.id,
        },
      })
    : [];

  return <ProductInfo product={product} defaultNotifications={notifications} />;
}
