import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { z } from "zod";

const ipifySchema = z.object({
  ip: z.string(),
});

const proxies = process.env.PROXIES?.split(",") ?? [];

const agents = proxies.map((proxy) => new HttpsProxyAgent(proxy));

export const getHttpsProxyAgent = (useProxy: boolean) => {
  if (!useProxy) return undefined;
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return agents[randomIndex];
};

export async function testProxy() {
  const endpoint = "https://api.ipify.org?format=json";
  const [withProxy, withoutProxy] = await axios.all([
    axios.get(endpoint, { httpsAgent: getHttpsProxyAgent(true) }),
    axios.get(endpoint),
  ]);

  if (!withProxy || !withoutProxy) {
    throw new Error("Failed to get IP address");
  }
  const withProxyIp = ipifySchema.parse(withProxy.data).ip;
  const withoutProxyIp = ipifySchema.parse(withoutProxy.data).ip;

  if (withProxyIp === "<nil>" || withoutProxyIp === "<nil>") {
    throw new Error("Failed to get IP address");
  }

  if (withProxyIp === withoutProxyIp) {
    throw new Error("Same IP addresses with proxy and without");
  }
  return true;
}
