import { findFollowingProducts } from "@awardrobe/db";

import { ProductList } from "./ProductList";

type FollowingProductListProps = {
  userId: string;
};

export async function FollowingProductList({ userId }: FollowingProductListProps) {
  const followingProducts = await findFollowingProducts({ userId });

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
