import { proxies } from "@awardrobe/proxies";

import { axios } from "./axios";

export async function downloadImage(imageUrl: string) {
  const { httpsAgent } = proxies.getRandomProxy();
  const imageResponse = await axios.get(imageUrl, { httpsAgent, responseType: "arraybuffer" });
  return Buffer.from(imageResponse.data);
}
