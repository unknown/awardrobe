import { Fragment } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { findFeaturedProducts, findFollowingProducts } from "@awardrobe/db";

import { PageControls } from "@/components/HomepageControls";
import { ProductSearchbar } from "@/components/product/controls/ProductListControls";
import { ProductList } from "@/components/product/list/ProductList";
import { authOptions } from "@/utils/auth";
import { isPage, Page, Pages } from "./types";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const cookiesStore = cookies();
  const cookiesPage = cookiesStore.get("page")?.value;
  const page: Page = isPage(cookiesPage) ? cookiesPage : "Featured";

  if (page === "Following" && !session) {
    redirect("/login");
  }

  const products =
    page === "Featured"
      ? await findFeaturedProducts({ limit: 24 })
      : session
        ? await findFollowingProducts({ userId: session.user.id })
        : [];

  return (
    <Fragment>
      <PageControls currPage={page} pages={[...Pages]} />
      <ProductSearchbar searchQuery={""} />
      <ProductList
        products={products.map(({ id, name, store }) => ({
          id,
          name,
          storeName: store.name,
        }))}
      />
    </Fragment>
  );
}
