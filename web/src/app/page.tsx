import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default async function Home() {
  let { data } = await supabase.from("products").select();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Price Monitor</h1>
        <div className="flex flex-col gap-1">
          {data?.map((product) => {
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
