import { handleHeartbeat } from "./monitors/uniqlo";
import * as dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

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
