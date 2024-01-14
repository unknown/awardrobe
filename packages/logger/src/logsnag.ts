import { LogSnag } from "@logsnag/node";

const logsnagToken = process.env.LOGSNAG_TOKEN;
const logsnagProject = process.env.LOGSNAG_PROJECT;

if (!logsnagToken) {
  throw new Error("LOGSNAG_TOKEN is not set");
}

if (!logsnagProject) {
  throw new Error("LOGSNAG_PROJECT is not set");
}

const logsnagSingleton = () => {
  return new LogSnag({
    token: logsnagToken,
    project: logsnagProject,
  });
};

export const logsnag = logsnagSingleton();
