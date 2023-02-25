import { supabase } from "@/lib/supabaseClient";

const timeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export default async function Home() {
  let { data } = await supabase
    .from("prices")
    .select()
    .eq("product_id", "E457967-000")
    .eq("size", "030")
    .eq("style", "08")
    .order("created_at", { ascending: false })
    .limit(30);

  const currentTime = new Date();

  return (
    <main className="p-4">
      <div className="font-bold">Price Monitor</div>
      <div className="flex flex-col gap-2">
        {data?.map((price) => {
          const createdTime = new Date(price.created_at).getTime();
          const elapsedTime = createdTime - currentTime.getTime();

          const formattedElapsedTime = timeFormat.format(
            Math.round(elapsedTime / 1000 / 60),
            "minutes"
          );

          return (
            <div className="py-2" key={price.id}>
              <p>Price: ${price.price_in_cents / 100}</p>
              <p>Stock: {price.stock}</p>
              <p>{formattedElapsedTime}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
