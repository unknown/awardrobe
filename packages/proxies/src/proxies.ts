import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { z } from "zod";

function initializeHttpsAgent(proxy: string) {
  return new HttpsProxyAgent(proxy, { keepAlive: true });
}

export type Proxy = {
  proxy: string;
  httpsAgent: HttpsProxyAgent<string>;
};

const ipifySchema = z.object({ ip: z.string() });
export class ProxyManager {
  private proxies: Proxy[];

  constructor(proxies: string[]) {
    if (proxies.length === 0) {
      throw new Error("No proxies provided");
    }

    this.proxies = proxies.map((proxy) => ({
      proxy,
      httpsAgent: initializeHttpsAgent(proxy),
    }));
  }

  public getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * this.proxies.length);
    const randomProxy = this.proxies[randomIndex] ?? null;

    if (!randomProxy) {
      throw new Error("No proxies available");
    }

    return randomProxy;
  }

  public getNumProxies() {
    return this.proxies.length;
  }

  private async testProxy({ proxy, httpsAgent }: Proxy): Promise<boolean> {
    const endpoint = "https://api.ipify.org?format=json";

    const requests = [
      axios.get(endpoint, { httpsAgent, timeout: 30000 }),
      axios.get(endpoint, { timeout: 30000 }),
    ];

    const [withProxyData, withoutProxyData] = await Promise.all(
      requests.map((request) => request.then((response) => ipifySchema.safeParse(response.data))),
    ).catch((error) => {
      console.error(`Error testing proxy ${proxy}\n${error}`);
      return [null, null];
    });

    const validData = withProxyData && withoutProxyData;
    const validResponses = withProxyData?.success && withoutProxyData?.success;
    if (!validData || !validResponses) {
      return false;
    }

    const [withProxyIp, withoutProxyIp] = [withProxyData.data.ip, withoutProxyData.data.ip];
    const validIps = withProxyIp !== "<nil>" && withoutProxyIp !== "<nil>";
    const differentIps = withProxyIp !== withoutProxyIp;

    return validIps && differentIps;
  }

  public async testProxies() {
    const results = await Promise.all(this.proxies.map((proxy) => this.testProxy(proxy)));

    const numSuccesses = results.filter(Boolean).length;
    const numFailures = results.length - numSuccesses;

    return { numSuccesses, numFailures };
  }
}
