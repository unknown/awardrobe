import { ProxiedClient } from "./client";

export * from "./client";

const proxiedClientSingleton = () => {
  return new ProxiedClient();
};

export const proxiedAxios = proxiedClientSingleton();
