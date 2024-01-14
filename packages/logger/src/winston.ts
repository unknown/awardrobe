import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { createLogger, format, transports } from "winston";

const logtailToken = process.env.LOGTAIL_TOKEN;

if (!logtailToken) {
  throw new Error("LOGTAIL_TOKEN is not set");
}

const loggerSingleton = () => {
  return createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    format: format.json(),
    transports: [new transports.Console(), new LogtailTransport(new Logtail(logtailToken))],
  });
};

export const logger = loggerSingleton();
