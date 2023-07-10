import "dotenv/config";

import cron from "node-cron";

import { testProxy } from "@awardrobe/adapters";

import { pingProducts } from "./monitors/uniqlo-us";

function setupMonitors() {
  cron.schedule(`*/10 * * * *`, async () => {
    await pingProducts();
  });
}

async function main() {
  try {
    await testProxy();
    console.log("Proxy is working");
  } catch (error) {
    console.warn(`Proxy is not working: ${error}`);
  }

  setupMonitors();

  console.log("Started monitoring");
}

void main();
