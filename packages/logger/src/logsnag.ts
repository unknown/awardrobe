import { LogSnag } from "@logsnag/node";

if (!process.env.LOGSNAG_TOKEN) {
  throw new Error("LOGSNAG_TOKEN is not set");
}

if (!process.env.LOGSNAG_PROJECT) {
  throw new Error("LOGSNAG_PROJECT is not set");
}

const logsnagSingleton = () => {
  return new LogSnag({
    token: process.env.LOGSNAG_TOKEN!,
    project: process.env.LOGSNAG_PROJECT!,
  });
};

export const logsnag = logsnagSingleton();
