import axios, { AxiosProxyConfig } from "axios";

export const proxy: AxiosProxyConfig = {
  protocol: "http",
  host: "p.webshare.io",
  port: 80,
  auth: {
    username: process.env.WEBSHARE_USERNAME!,
    password: process.env.WEBSHARE_PASSWORD!,
  },
};

export async function testProxy() {
  const endpoint = "https://api.ipify.org?format=json";
  const [withProxy, withoutProxy] = await axios.all([
    axios.get(endpoint, { proxy }),
    axios.get(endpoint),
  ]);
  if (!withProxy?.data.ip || !withoutProxy?.data.ip) {
    throw new Error("Failed to get IP address");
  }
  if (withProxy.data.ip === withoutProxy.data.ip) {
    throw new Error("Proxy is not working");
  }
  return true;
}
