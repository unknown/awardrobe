import { proxiedAxios } from "@awardrobe/proxied-axios";

export async function downloadImage(imageUrl: string) {
  const imageResponse = await proxiedAxios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  return Buffer.from(imageResponse.data);
}
