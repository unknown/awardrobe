import { HttpsProxyAgent } from "https-proxy-agent";

export const proxies = process.env.PROXIES?.split(",") ?? [];

const agentFromProxy: Map<string, HttpsProxyAgent<string>> = new Map();

export function getRandomProxy() {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex] ?? null;
}

export function getHttpsProxyAgent(proxy: string) {
  const agent = agentFromProxy.get(proxy) ?? new HttpsProxyAgent(proxy);
  agentFromProxy.set(proxy, agent);
  return agent;
}

export function getRandomHttpsProxyAgent() {
  const proxy = getRandomProxy();
  if (!proxy) {
    return null;
  }
  return getHttpsProxyAgent(proxy);
}
