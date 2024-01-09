import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { AdaptersError, handleAxiosError } from "../errors";
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
    return new Set();
  },

  // since different swatches of the same product are listed under different product codes, a product's unique identifier (i.e. our `productCode`) is the `code` of the first swatch
  // this makes the assumption that the first swatch never changes
  async getProductCode(url) {
    const productCodeRegex = /(?<=\/p\/)[\w]+/;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.[0];
    if (!productCode) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Regex failed to get product code",
      });
    }

    const swatchesEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}/swatchdata?fields=FULL&lang=en_US`;
    const swatchesResponse = await proxiedAxios.get(swatchesEndpoint, { headers });

    const result = swatchesSchema.safeParse(swatchesResponse.data);
    if (!result.success) {
      throw new AdaptersError({
        name: "SCHEMA_INVALID_INPUT",
        message: "Failed to parse swatches response",
        cause: result.error,
      });
    }

    const swatchCode = result.data.swatches[0]?.code;
    if (!swatchCode) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Failed to get swatch code",
      });
    }

    return swatchCode;
  },

  async getProductDetails(productCode) {
    const swatchesEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}/swatchdata?fields=FULL&lang=en_US`;
    const detailsEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}?fields=FULL&lang=en_US`;
    const [swatchesResponse, detailsResponse] = await Promise.all([
      proxiedAxios.get(swatchesEndpoint, { headers }),
      proxiedAxios.get(detailsEndpoint, { headers }),
    ]).catch(handleAxiosError);

    const swatchesResult = swatchesSchema.safeParse(swatchesResponse.data);
    if (!swatchesResult.success) {
      throw new AdaptersError({
        name: "SCHEMA_INVALID_INPUT",
        message: "Failed to parse swatches response",
        cause: swatchesResult.error,
      });
    }

    const detailsResult = productSchema.safeParse(detailsResponse.data);
    if (!detailsResult.success) {
      throw new AdaptersError({
        name: "SCHEMA_INVALID_INPUT",
        message: "Failed to parse details response",
        cause: detailsResult.error,
      });
    }

    // two types of sizing schemes: pants and general
    const isPants = "variantWaist" in detailsResult.data;

    const { swatches } = swatchesResult.data;
    const { name, description, galleryImageList, url } = detailsResult.data;

    // TODO: make this concurrent?
    // TODO: duplicate details request to first swatch
    const variants: VariantInfo[] = [];
    for (const swatch of swatches) {
      const swatchDetailsEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${swatch.code}?fields=FULL&lang=en_US`;
      const swatchDetailsResponse = await proxiedAxios
        .get(swatchDetailsEndpoint, { headers })
        .catch(handleAxiosError);
      const timestamp = new Date();

      const swatchDetailsResult = productSchema.safeParse(swatchDetailsResponse.data);
      if (!swatchDetailsResult.success) {
        throw new AdaptersError({
          name: "SCHEMA_INVALID_INPUT",
          message: "Failed to parse swatch details response",
          cause: swatchDetailsResult.error,
        });
      }

      const { variantOptions, colorName, url } = swatchDetailsResult.data;
      const swatchVariants: VariantInfo[] = variantOptions.map((variant) => {
        const attributes = isPants
          ? parsePantsAttributes(variant.displaySizeDescription)
          : parseGeneralAttributes(variant.displaySizeDescription);

        if (!attributes) {
          throw new AdaptersError({
            name: "SCHEMA_INVALID_INPUT",
            message: "Failed to parse variant attributes",
          });
        }

        return {
          timestamp,
          attributes: [{ name: "Color", value: colorName }, ...attributes],
          inStock: variant.stock.stockLevel > 0 && !variant.comingSoon,
          priceInCents: dollarsToCents(variant.priceData.formattedValue),
          productUrl: `https://www.levi.com/US/en_US${url}`,
        };
      });

      variants.push(...swatchVariants);
    }

    return {
      name,
      variants,
      description,
      productUrl: `https://www.levi.com/US/en_US${url}`,
      imageUrl: getImageUrl(galleryImageList.galleryImage) ?? undefined,
    };
  },
};
