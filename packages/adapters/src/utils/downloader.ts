import { proxiedAxios } from "@awardrobe/proxied-axios";

function getImageName(url: string) {
  const urlObject = new URL(url);
  const pathParts = urlObject.pathname.split("/");
  return pathParts[pathParts.length - 1] ?? "image";
}

export async function downloadImage(imageUrl: string) {
  const response = await proxiedAxios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const imageName = getImageName(imageUrl);
  const mimeType = response.headers["content-type"];
  const imageBuffer = Buffer.from(response.data);

  const file = new File([imageBuffer], imageName, { type: mimeType });

  return file;
}
