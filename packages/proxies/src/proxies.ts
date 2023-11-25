import { HttpsProxyAgent } from "https-proxy-agent";

function initializeHttpsAgent(proxy: string) {
  return new HttpsProxyAgent(proxy, { keepAlive: true });
}

const envProxies = process.env.PROXIES?.split(",") ?? [];

export type Proxy = {
  proxy: string;
  httpsAgent: HttpsProxyAgent<string>;
};

export const proxies: Proxy[] = envProxies.map((proxy) => ({
  proxy,
  httpsAgent: initializeHttpsAgent(proxy),
}));

export function getRandomProxy() {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  const randomProxy = proxies[randomIndex] ?? null;

  if (!randomProxy) {
    throw new Error("No proxies available");
  }

  return randomProxy;
}
