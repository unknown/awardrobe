import * as dotenv from "dotenv";
import cron from "node-cron";

import { handleHeartbeat } from "./monitors/uniqlo";

dotenv.config();

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
