import Link from "next/link";
import { redirect } from "next/navigation";

import { findFollowingProducts } from "@awardrobe/db";

import { auth } from "@/utils/auth";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const products = await findFollowingProducts({
    userId: session.user.id,
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
          </div>
        ))}
      </section>
    </section>
  );
}
