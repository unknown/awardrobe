import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default async function Home() {
  let { data } = await supabase.from("products").select();

  return (
    <main className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Price Monitor</h1>
        <div>
          {data?.map((product) => {
            return (
              <div key={product.id}>
                <Link href={`/product/${product.id}`}>{product.name}</Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
