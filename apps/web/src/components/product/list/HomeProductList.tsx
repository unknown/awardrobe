import { auth } from "@awardrobe/auth";
import { findFeedProducts, findFollowingProducts } from "@awardrobe/db";

import { Page } from "@/app/(app)/(browse)/home/types";
import { ProductList } from "@/components/product/list/ProductList";

type HomeProductListProps = {
  page: Page;
};

export async function HomeProductList({ page }: HomeProductListProps) {
  const session = await auth();

  if (page === "Following" && !session) {
    return <p className="text-center">Sign in to see the products you follow.</p>;
  }

  const products =
    page === "Featured"
      ? await findFeedProducts({ type: "featured", limit: 24 })
      : session
        ? await findFeedProducts({ type: "following", userId: session.user.id, limit: 24 })
        : [];

  return (
    <ProductList
      products={products.map(({ publicId, name, collection }) => ({
        name,
        id: publicId,
        brand: collection.brand.name,
      }))}
    />
  );
}
