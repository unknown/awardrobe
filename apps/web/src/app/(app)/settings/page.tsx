import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { VariantAttribute } from "@awardrobe/adapters";
import { findFollowingProducts } from "@awardrobe/db";

import { authOptions } from "@/utils/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect("/login");
  }

  const products = await findFollowingProducts({
    userId: session.user.id,
    includeFollowingVariants: true,
  });

  return (
    <section className="container max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Email</h2>
        <div className="space-y-6">{session.user.email}</div>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Notifications</h2>
        {products.map((product) => (
          <div key={product.id}>
            <h3 className="text-lg font-medium">
              <Link href={`/product/${product.id}`}>{product.name}</Link>
            </h3>
            <div className="space-y-0.5">
              {product.variants.map((variant) => {
                const attributes = variant.attributes as VariantAttribute[];
                const description = attributes.map(({ value }) => value).join(" - ");
                return (
                  <p key={variant.id} className="text-muted-foreground text-sm">
                    {description}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </section>
  );
}
