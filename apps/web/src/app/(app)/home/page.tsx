import { Fragment } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { findFollowingProducts } from "@awardrobe/db";
import { Product, searchProducts } from "@awardrobe/meilisearch-types";

import { PageControls } from "@/app/(app)/home/PageControls";
import { ProductList } from "@/components/product/list/ProductList";
import { ProductListControls } from "@/components/product/list/ProductListControls";
import { authOptions } from "@/utils/auth";

const Pages = ["Featured", "Following"] as const;
type Page = (typeof Pages)[number];
const isPage = (page: any): page is Page => Pages.includes(page as Page);

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const cookiesStore = cookies();
  const cookiesPage = cookiesStore.get("page")?.value;
  const page: Page = isPage(cookiesPage) ? cookiesPage : "Featured";

  if (page === "Following" && !session) {
    redirect("/login");
  }

  const products: Product[] =
    page === "Featured"
      ? await searchProducts({
          page: 1,
          query: "",
          hitsPerPage: 24,
        }).then((response) => response.hits as Product[])
      : session
        ? (await findFollowingProducts({ userId: session.user.id })).map(({ id, name, store }) => ({
            id,
            name,
            storeName: store.name,
          }))
        : [];

  return (
    <Fragment>
      <PageControls currPage={page} pages={[...Pages]} />
      <ProductListControls searchQuery={""} />
      <ProductList products={products} />
    </Fragment>
  );
}
