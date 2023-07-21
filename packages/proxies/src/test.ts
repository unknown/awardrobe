import axios from "axios";
import { z } from "zod";

import { getHttpsProxyAgent, proxies } from "./proxies";

const ipifySchema = z.object({ ip: z.string() });

type ProxyTestResult = { success: true } | { success: false; error: string };

export async function testProxy(proxy: string): Promise<ProxyTestResult> {
  const endpoint = "https://api.ipify.org?format=json";
  const [withProxy, withoutProxy] = await axios.all([
    axios.get(endpoint, { httpsAgent: getHttpsProxyAgent(proxy) }),
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

export async function testProxies() {
  const results = await Promise.all(proxies.map((proxy) => testProxy(proxy)));

  const numSuccesses = results.filter((result) => result.success).length;
  const numFailures = results.length - numSuccesses;

  return { numSuccesses, numFailures };
}
