import axios from "axios";

import { ProductDetails } from "@awardrobe/adapters";
import { proxies } from "@awardrobe/proxies";

// TODO: throw if env vars are not set
const MEDIA_WORKER_URL = process.env.MEDIA_WORKER_URL;
const MEDIA_WORKER_SECRET = process.env.MEDIA_WORKER_SECRET;
const MEDIA_CDN_URL = process.env.MEDIA_CDN_URL;

function getPath(productId: string) {
  return `/product/${productId}`;
}

export function getWorkerUrl(productId: string) {
  const path = getPath(productId);
  return new URL(path, MEDIA_WORKER_URL).href;
}

export function getCdnUrl(productId: string) {
  const path = getPath(productId);
  return new URL(path, MEDIA_CDN_URL).href;
}

export async function addProduct(productId: string, product: ProductDetails) {
  const { imageUrl } = product;

  if (!imageUrl) {
    return null;
  }

  const { httpsAgent } = proxies.getRandomProxy();
  const imageResponse = await axios.get(imageUrl, { httpsAgent, responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(imageResponse.data);

  const workerUrl = getWorkerUrl(productId);
  await axios.put(workerUrl, imageBuffer, {
    headers: { Authorization: `Bearer ${MEDIA_WORKER_SECRET}` },
  });

  return getCdnUrl(productId);
}
