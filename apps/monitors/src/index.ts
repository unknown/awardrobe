import * as dotenv from "dotenv";
dotenv.config();

import { handleHeartbeat } from "./monitors/uniqlo";

import cron from "node-cron";

function setupMonitors() {
  cron.schedule(`*/10 * * * *`, async () => {
    console.log("Initiating heartbeat for Uniqlo US");
    await handleHeartbeat();
    console.log("Heartbeat for Uniqlo US finished");
  });
}

function main() {
  setupMonitors();

  console.log("Started monitoring");
}

void main();
