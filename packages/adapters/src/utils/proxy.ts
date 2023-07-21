import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { z } from "zod";

const ipifySchema = z.object({
  ip: z.string(),
});

const proxies = process.env.PROXIES?.split(",") ?? [];

const agents = proxies.map((proxy) => new HttpsProxyAgent(proxy));

export function getHttpsProxyAgent() {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return agents[randomIndex];
}

type ProxyTestResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function testProxy(): Promise<ProxyTestResult> {
  const endpoint = "https://api.ipify.org?format=json";
  const [withProxy, withoutProxy] = await axios.all([
    axios.get(endpoint, { httpsAgent: getHttpsProxyAgent() }),
    axios.get(endpoint),
  ]);

  if (!withProxy || !withoutProxy) {
    return { success: false, error: "Failed to get IP address" };
  }
  const withProxyIp = ipifySchema.parse(withProxy.data).ip;
  const withoutProxyIp = ipifySchema.parse(withoutProxy.data).ip;

  if (withProxyIp === "<nil>" || withoutProxyIp === "<nil>") {
    return { success: false, error: "Failed to get IP address" };
  } else if (withProxyIp === withoutProxyIp) {
    return { success: false, error: "Same IP addresses with proxy and without" };
  }

  return { success: true };
}
