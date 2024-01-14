import { createLogger, format, transports } from "winston";

const loggerSingleton = () => {
  return createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    format: format.json(),
    transports: [new transports.Console()],
  });
};

export const logger = loggerSingleton();
