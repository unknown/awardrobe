import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginButton, LogoutButton } from "@/components/AuthButtons";
import { prisma } from "@/utils/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const products = await prisma.product.findMany();

  return (
    <main className="mx-auto flex h-screen max-w-4xl flex-col p-4">
      {session ? <LogoutButton /> : <LoginButton />}
      <div>
        <h1 className="mb-2 text-3xl font-bold">Price Monitor</h1>
        <div className="flex flex-col gap-1">
          {products.map((product) => {
            return (
              <Link key={product.id} href={`/product/${product.id}`}>
                {product.name}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
