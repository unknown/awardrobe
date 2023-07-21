import { HttpsProxyAgent } from "https-proxy-agent";

export const proxies = [
  "http://cap116:wrFOZ@154.3.57.115:61234",
  "http://cap1940:ugySW@154.22.4.147:61234",
  "http://cap2492:VUrFz@154.21.235.187:61234",
  "http://cap79:YuMcR@50.118.247.142:61234",
  "http://isp1037:oSUmb@5.182.123.12:61234",
  "http://cap87:rfknc@50.118.247.150:61234",
];

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
