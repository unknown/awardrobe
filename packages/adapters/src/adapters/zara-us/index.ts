import axios from "axios";
import parse from "node-html-parser";

import { getRandomHttpsProxyAgent } from "@awardrobe/proxies";

import { toTitleCase } from "../../utils/formatter";
import { StoreAdapter, VariantInfo } from "../../utils/types";
import { productSchema } from "./schemas";

const ZaraUS: StoreAdapter = {
  urlPrefixes: ["zara.com/us/"],
  storeHandle: "zara-us",
  getProducts,
  getProductCode,
  getProductDetails,
};
export default ZaraUS;

// TODO: implement
async function getProducts(_?: number) {
  return [];
}

async function getProductCode(url: string) {
  const httpsAgent = getRandomHttpsProxyAgent();
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    Connection: "keep-alive",
  };
  const initialResponse = await axios.get(url, { httpsAgent, headers });

  if (initialResponse.status !== 200) {
    throw new Error(`Failed to search for product ${url}. Status code: ${initialResponse.status}`);
  }

  const initialRoot = parse(initialResponse.data);
  const challengeRegex = /URL='(.*)'/;
  const challengeRoute = initialRoot
    .querySelector('meta[http-equiv="refresh"]')
    ?.getAttribute("content")
    ?.match(challengeRegex)?.[1];

  if (!challengeRoute) {
    throw new Error(`Failed to get product code from ${url}`);
  }
  const challengeUrl = `https://www.zara.com${challengeRoute}`;

  const productResponse = await axios.get(challengeUrl, { httpsAgent, headers });
  const root = parse(productResponse.data);

  const htmlId = root.querySelector("html")?.getAttribute("id");
  const productId = htmlId?.split("-").pop();

  if (!productId) {
    throw new Error(`Failed to get product code from ${url}`);
  }

  return productId;
}

async function getProductDetails(productCode: string) {
  const productEndpoint = `https://www.zara.com/itxrest/4/catalog/store/11719/product/id/${productCode}`;
  const httpsAgent = getRandomHttpsProxyAgent();
  const headers = {
    "User-Agent": "ZaraApp/13.0.3 (iPhone; iOS 16.5.1) (compatible; Zara/App/iOS/v13.0.3)",
  };
  const params = { locale: "en_US" };
  const productResponse = await axios.get(productEndpoint, { httpsAgent, headers, params });
  const timestamp = new Date();

  if (productResponse.status !== 200) {
    throw new Error(
      `Failed to get product details for ${productCode}. Status code: ${productResponse.status}`,
    );
  }

  const { name, detail, seo } = productSchema.parse(productResponse.data);
  // TODO: per variant product urls

  const variants: VariantInfo[] = detail.colors.flatMap((color) => {
    const productUrl = `https://www.zara.com/us/en/${seo.keyword}-p${seo.seoProductId}.html?v1=${color.productId}`;
    return color.sizes.map((size) => ({
      timestamp,
      productUrl,
      attributes: [
        { name: detail.colorSelectorLabel, value: `${color.id} ${color.name}` },
        { name: "Size", value: size.name },
      ],
      inStock: size.availability !== "out_of_stock",
      priceInCents: size.price,
    }));
  });

  return {
    variants,
    name: toTitleCase(name),
  };
}
