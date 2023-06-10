import * as dotenv from "dotenv";
import prisma from "./utils/database";
dotenv.config();

// TODO: dynamic endpoints to support other stores
const endpoint = "http://localhost:3001/uniqlo-us/heartbeat";
const headers = { "Content-Type": "application/json" };

async function main() {
  const products = await prisma.product.findMany();

  const requests = products.map((product) => {
    const body = { productCode: product.productCode };
    return fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
  });

  await Promise.all(requests);
}

void main();
