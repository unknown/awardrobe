import * as dotenv from "dotenv";
dotenv.config();

import prisma from "./utils/database";
import cron from "node-cron";

const PORT = process.env.PORT ?? 3001;
const BASE_ENDPOINT = `http://localhost:${PORT}`;

async function pingUniqlo() {
  console.log("Pinging Uniqlo US");
  const endpoint = `${BASE_ENDPOINT}/uniqlo-us/heartbeat`;
  const products = await prisma.product.findMany();

  const requests = products.map((product) => {
    const body = { productCode: product.productCode };
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });

  await Promise.all(requests);
}

function main() {
  console.log(`Pinger configured on http://localhost:${PORT}`);
  cron.schedule(`*/10 * * * *`, pingUniqlo);
}

void main();
