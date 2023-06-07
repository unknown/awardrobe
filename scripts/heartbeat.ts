import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, {
  auth: { persistSession: false },
});

// TODO: dynamic endpoints to support other stores
const endpoint = "http://localhost:3001/uniqlo-us/heartbeat";
const headers = { "Content-Type": "application/json" };

async function main() {
  const { data, error } = await supabase.from("products").select();

  if (!data || error) {
    return;
  }

  const requests = data.map((product) => {
    const body = { productId: product.product_id };
    return fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
  });

  await Promise.all(requests);
}

void main();
