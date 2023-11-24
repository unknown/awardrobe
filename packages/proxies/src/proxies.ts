import { HttpsProxyAgent } from "https-proxy-agent";

export const proxies = process.env.PROXIES?.split(",") ?? [];

const agentFromProxy: Map<string, HttpsProxyAgent<string>> = new Map();

export function getRandomProxy() {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex] ?? null;
}

export function getHttpsProxyAgent(proxy: string) {
  const existingAgent = agentFromProxy.get(proxy);
  if (existingAgent) {
    return existingAgent;
  }

  const agent = new HttpsProxyAgent(proxy, { keepAlive: true });
  agentFromProxy.set(proxy, agent);

  return agent;
}

export function getRandomHttpsProxyAgent() {
  const proxy = getRandomProxy();
  return proxy ? getHttpsProxyAgent(proxy) : null;
}
