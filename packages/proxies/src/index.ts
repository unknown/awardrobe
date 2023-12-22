import { ProxyManager } from "./proxies";

export * from "./proxies";

const proxyManagerSingleton = () => {
  const envProxies = process.env.PROXIES?.split(",") ?? [];
  return new ProxyManager(envProxies);
};

export const proxies = proxyManagerSingleton();
