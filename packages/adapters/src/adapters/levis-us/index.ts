import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { handleAxiosError } from "../errors";
import { StoreAdapter, VariantAttribute, VariantInfo } from "../types";
import { GalleryImage, productSchema, swatchesSchema } from "./schemas";

const headers = {
  "User-Agent": "LeviStraussAmericasAppiOS16.7.2",
};

function parsePantsAttributes(description: string): VariantAttribute[] | null {
  const attributesRegex = /(\d+)W\s?X\s?(\d+)L/i;
  const matches = description.match(attributesRegex);
  const [_, waist, length] = matches ?? [];
  if (!waist || !length) {
    return null;
  }
  return [
    { name: "Waist", value: waist },
    { name: "Length", value: length },
  ];
}

function parseGeneralAttributes(description: string): VariantAttribute[] {
  return [{ name: "Size", value: description }];
}

function getImageUrl(galleryImages: GalleryImage[]) {
  const image = galleryImages.find(
    (image) => image.format === "Regular_Tablet" && image.imageType === "GALLERY",
  );
  return image?.url ?? null;
}

export const LevisUS: StoreAdapter = {
  urlRegex: /^(?:www.)?levi\.com\/US\//,
  storeHandle: "levis-us",

  async getProducts(_) {
    return [];
  },

  // since different swatches of the same product are listed under different product codes, a product's unique identifier (i.e. our `productCode`) is the `code` of the first swatch
  // this makes the assumption that the first swatch never changes
  async getProductCode(url) {
    const productCodeRegex = /(?<=\/p\/)[\w]+/;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.[0];
    if (!productCode) {
      return null;
    }

    const swatchesEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}/swatchdata?fields=FULL&lang=en_US`;
    const swatchesResponse = await proxiedAxios.get(swatchesEndpoint, { headers });

    const swatches = swatchesSchema.parse(swatchesResponse.data);

    return swatches.swatches[0]?.code ?? null;
  },

  async getProductDetails(productCode) {
    const swatchesEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}/swatchdata?fields=FULL&lang=en_US`;
    const detailsEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}?fields=FULL&lang=en_US`;
    const [swatchesResponse, detailsResponse] = await Promise.all([
      proxiedAxios.get(swatchesEndpoint, { headers }),
      proxiedAxios.get(detailsEndpoint, { headers }),
    ]).catch(handleAxiosError);
    const swatches = swatchesSchema.parse(swatchesResponse.data);
    const details = productSchema.parse(detailsResponse.data);

    // two types of sizing schemes: pants and general
    const isPants = "variantWaist" in details;

    // TODO: make this concurrent?
    // TODO: duplicate details request to first swatch
    const variants: VariantInfo[] = [];
    for (const swatch of swatches.swatches) {
      const detailsEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${swatch.code}?fields=FULL&lang=en_US`;
      const detailsResponse = await proxiedAxios
        .get(detailsEndpoint, { headers })
        .catch(handleAxiosError);
      const details = productSchema.parse(detailsResponse.data);
      const timestamp = new Date();

      const swatchVariants: VariantInfo[] = details.variantOptions.map((variant) => {
        const attributes = isPants
          ? parsePantsAttributes(variant.displaySizeDescription)
          : parseGeneralAttributes(variant.displaySizeDescription);

        if (!attributes) {
          throw new Error("Failed to parse product attributes");
        }

        return {
          timestamp,
          attributes: [{ name: "Color", value: details.colorName }, ...attributes],
          inStock: variant.stock.stockLevel > 0 && !variant.comingSoon,
          priceInCents: dollarsToCents(variant.priceData.formattedValue),
          productUrl: `https://www.levi.com/US/en_US${details.url}`,
        };
      });

      variants.push(...swatchVariants);
    }

    return {
      variants,
      name: details.name,
      productUrl: `https://www.levi.com/US/en_US${details.url}`,
      description: details.description,
      imageUrl: getImageUrl(details.galleryImageList.galleryImage) ?? undefined,
    };
  },
};
