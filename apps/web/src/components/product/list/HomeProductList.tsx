import { getServerSession } from "next-auth";

import { findFeaturedProducts, findFollowingProducts } from "@awardrobe/db";

import { Page } from "@/app/(app)/(browse)/home/types";
import { ProductList } from "@/components/product/list/ProductList";
import { authOptions } from "@/utils/auth";

type HomeProductListProps = {
  page: Page;
};

export async function HomeProductList({ page }: HomeProductListProps) {
  const session = await getServerSession(authOptions);

  const products =
    page === "Featured"
      ? await findFeaturedProducts({ limit: 24 })
      : session
        ? await findFollowingProducts({ userId: session.user.id })
        : [];

  return (
    <ProductList
      products={products.map(({ id, name, store }) => ({
        id,
        name,
        storeName: store.name,
      }))}
    />
  );
}
