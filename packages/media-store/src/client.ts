import axios from "axios";

import { downloadImage } from "@awardrobe/adapters";

const MEDIA_WORKER_URL = process.env.MEDIA_WORKER_URL;
const MEDIA_WORKER_SECRET = process.env.MEDIA_WORKER_SECRET;

if (!MEDIA_WORKER_URL || !MEDIA_WORKER_SECRET) {
  throw new Error("Missing MEDIA_WORKER_URL or MEDIA_WORKER_SECRET");
}

export function getProductPath(productId: string) {
  return `/product/${productId}`;
}

export async function addProductImage(productId: string, imageUrl: string) {
  const imageBuffer = await downloadImage(imageUrl);

  const path = getProductPath(productId);
  const workerUrl = new URL(path, MEDIA_WORKER_URL).href;

  const data = new FormData();
  data.append("file", new Blob([imageBuffer]));

  const headers = { Authorization: `Bearer ${MEDIA_WORKER_SECRET}` };

  await axios.put(workerUrl, data, { headers });
}
