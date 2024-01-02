import { proxiedAxios } from "@awardrobe/proxied-axios";

export async function downloadImage(imageUrl: string) {
  const response = await proxiedAxios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  return Buffer.from(response.data);
}
