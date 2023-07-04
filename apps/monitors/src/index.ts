import "dotenv/config";

import cron from "node-cron";

import { testProxy } from "@awardrobe/adapters";

import { handleHeartbeat } from "./monitors/uniqlo-us";

function setupMonitors() {
  cron.schedule(`*/10 * * * *`, async () => {
    console.log("Initiating heartbeat for Uniqlo US");
    await handleHeartbeat();
    console.log("Heartbeat for Uniqlo US finished");
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
