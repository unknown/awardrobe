import { Fragment, Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Skeleton } from "@ui/Skeleton";
import { getServerSession } from "next-auth";

import { updateHomepage } from "@/app/(app)/(browse)/home/actions";
import { PageControls } from "@/components/HomepageControls";
import { HomeProductList } from "@/components/product/list/HomeProductList";
import { authOptions } from "@/utils/auth";
import { isPage, Page, Pages } from "./types";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const cookiesStore = cookies();
  const cookiesPage = cookiesStore.get("page")?.value;
  const page: Page = isPage(cookiesPage) ? cookiesPage : "Featured";

  if (page === "Following" && !session) {
    await updateHomepage("Featured");
    redirect("/login");
  }

  return (
    <Fragment>
      <PageControls currPage={page} pages={[...Pages]} />
      <Suspense
        key={page}
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[48px]" />
            ))}
          </div>
        }
      >
        <HomeProductList page={page} />
      </Suspense>
    </Fragment>
  );
}
