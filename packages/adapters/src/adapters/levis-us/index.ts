import { proxiedAxios } from "@awardrobe/proxied-axios";

import { dollarsToCents } from "../../utils/formatter";
import { AdaptersError, handleAxiosError } from "../errors";
import { ProductDetails, StoreAdapter, VariantAttribute, VariantDetails } from "../types";
import { GalleryImage, productsSchema } from "./schemas";

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

  async getListingIds(_) {
    return new Set();
  },

  // since different swatches of the same product are listed under different product codes, a product's unique identifier (i.e. our `productCode`) is the `code` of the first swatch
  // this makes the assumption that the first swatch never changes
  async getListingId(url) {
    const productCodeRegex = /(?<=\/p\/)[\w]+/;
    const matches = url.match(productCodeRegex);

    const productCode = matches?.[0];
    if (!productCode) {
      throw new AdaptersError({
        name: "PRODUCT_CODE_NOT_FOUND",
        message: "Regex failed to get product code",
      });
    }

    return productCode;
  },

  async getListingDetails(productCode) {
    const detailsEndpoint = `https://www.levi.com/mule/lma/v1/leviUSSite/products/${productCode}?fields=FULL&lang=en_US`;
    const detailsResponse = await proxiedAxios
      .get(detailsEndpoint, { headers })
      .catch(handleAxiosError);
    const timestamp = new Date();

    const detailsResult = productsSchema.safeParse(detailsResponse.data);
    if (!detailsResult.success) {
      throw new AdaptersError({
        name: "INVALID_RESPONSE",
        message: "Failed to parse details response",
        cause: detailsResult.error,
      });
    }

    // two types of sizing schemes: pants and general
    const isPants = "variantWaist" in detailsResult.data;

    const {
      baseProduct,
      code,
      name,
      description,
      galleryImageList,
      url,
      variantOptions,
      colorName,
    } = detailsResult.data;

    const variants: VariantDetails[] = variantOptions.map((variant) => {
      const attributes = isPants
        ? parsePantsAttributes(variant.displaySizeDescription)
        : parseGeneralAttributes(variant.displaySizeDescription);
      if (!attributes) {
        throw new AdaptersError({
          name: "INVALID_RESPONSE",
          message: "Failed to parse variant attributes",
        });
      }

      return {
        attributes: [{ name: "Color", value: colorName }, ...attributes],
        productUrl: `https://www.levi.com/US/en_US${url}`,
        price: {
          timestamp,
          inStock: variant.stock.stockLevel > 0 && !variant.comingSoon,
          priceInCents: dollarsToCents(variant.priceData.formattedValue),
        },
      };
    });

    const product: ProductDetails = {
      name,
      description,
      variants,
      productId: code,
      imageUrl: getImageUrl(galleryImageList.galleryImage),
    };

    return {
      brand: "levis",
      collectionId: baseProduct,
      products: [product],
    };
  },
};
