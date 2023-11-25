import { ProxyManager } from "./src/proxies";

export * from "./src/proxies";

const proxyManagerSingleton = () => {
  const envProxies = process.env.PROXIES?.split(",") ?? [];
  return new ProxyManager(envProxies);
};

export const proxies = proxyManagerSingleton();
