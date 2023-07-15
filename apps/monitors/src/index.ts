import "dotenv/config";

import cron from "node-cron";

import { testProxy } from "@awardrobe/adapters";

import { pingProducts } from "./monitors";

function setupMonitors() {
  cron.schedule(`*/10 * * * *`, () => {
    pingProducts().catch((error) => {
      console.error(`Error pinging products\n${error}`);
    });
  });
}

async function main() {
  const result = await testProxy();
  if (result.success) {
    console.log("Proxy is working");
  } else {
    console.warn(`Proxy is not working: ${result.error}`);
  }

  setupMonitors();

  console.log("Started monitoring");
}

void main();
