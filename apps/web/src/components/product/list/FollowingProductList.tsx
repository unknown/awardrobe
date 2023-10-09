import { prisma } from "@awardrobe/prisma-types";

import { ProductList } from "./ProductList";

type FollowingProductListProps = {
  userId: string;
};

export async function FollowingProductList({ userId }: FollowingProductListProps) {
  const followingProducts = await prisma.product.findMany({
    where: { variants: { some: { notifications: { some: { userId } } } } },
    include: { store: true },
  });

  return (
    <ProductList
      products={followingProducts.map(({ id, name, store }) => ({
        id,
        name,
        storeName: store.name,
      }))}
    />
  );
}
