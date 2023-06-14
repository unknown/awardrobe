import * as dotenv from "dotenv";
dotenv.config();

import cron from "node-cron";
import { handleHeartbeat } from "./monitors/uniqlo";

function setupMonitors() {
  cron.schedule(`*/10 * * * *`, async () => {
    await handleHeartbeat();
    console.log("Heartbeat for Uniqlo US finished");
  });
}

function main() {
  setupMonitors();

  console.log("Started monitoring");
}

void main();
