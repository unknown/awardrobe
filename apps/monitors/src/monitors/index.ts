import {
  downloadImage,
  getAdapter,
  ProductDetails,
  VariantAttribute,
  VariantInfo,
} from "@awardrobe/adapters";
import {
  createLatestPrice,
  createProduct,
  createProductVariant,
  ProductWithLatestPrice,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";
import { Price } from "@awardrobe/prisma-types";

import { shallowEquals } from "../utils/utils";
import { updateVariantCallbacks } from "./callbacks";
import { VariantFlags } from "./types";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL");
}

console.log(`Using ${baseUrl} as base URL`);

export async function insertProduct(productCode: string, storeHandle: string) {
  const details = await getUpdatedDetails({ storeHandle, productCode }).catch((error) => {
    console.error(`Failed to get details while inserting product ${productCode}\n${error}`);
    return null;
  });

  if (!details) {
    return;
  }

  const product = await createProduct({
    productCode,
    storeHandle,
    name: details.name,
    variants: details.variants,
  });

  for (const variantInfo of details.variants) {
    const variantAttributesMap = attributesToMap(variantInfo.attributes);
    const variant = product.variants.find((variant) => {
      const variantAttributes = variant.attributes as VariantAttribute[];
      return shallowEquals(variantAttributesMap, attributesToMap(variantAttributes));
    });

    if (!variant) {
      console.error(
        `Failed to find variant ${JSON.stringify(variantInfo.attributes)} for ${product.name}`,
      );
      continue;
    }

    await createLatestPrice({
      variantId: variant.id,
      variantInfo,
    });
  }

  await addProduct({
    id: product.id,
    name: product.name,
    storeName: product.store.name,
  });

  if (details.imageUrl) {
    const image = await downloadImage(details.imageUrl);
    await addProductImage(product.id, image);
  }

  // TODO: relocate this?
  const url = new URL("/api/products/revalidate", baseUrl);
  await fetch(url.toString());
}

export async function updateProduct(product: ProductWithLatestPrice) {
  const details = await getUpdatedDetails({
    storeHandle: product.store.handle,
    productCode: product.productCode,
  }).catch((error) => {
    console.error(`Failed to get updated details for ${product.name}\n${error}`);
    return null;
  });

  if (!details) {
    return;
  }

  const allVariantsCallbacks = details.variants.map(async (variantInfo) => {
    const productVariant = await getProductVariant(product, variantInfo);
    const flags = getFlags(variantInfo, productVariant.latestPrice);
    const options = { product, variantInfo, productVariant };

    const singleVariantCallbacks = Object.entries(flags).map(([flag, value]) => {
      if (!value) {
        return null;
      }

      const callback = updateVariantCallbacks[flag as keyof VariantFlags](options);
      return callback.catch((error) =>
        console.error(
          `Failed to run ${flag} callback for ${product.name} (${variantInfo.attributes})\n${error}`,
        ),
      );
    });

    await Promise.all(singleVariantCallbacks);
  });

  await Promise.all(allVariantsCallbacks);
}

async function getUpdatedDetails(options: {
  storeHandle: string;
  productCode: string;
}): Promise<ProductDetails> {
  const { storeHandle, productCode } = options;
  const adapter = getAdapter(storeHandle);

  if (!adapter) {
    throw new Error(`No adapter found for ${storeHandle}`);
  }

  return await adapter.getProductDetails(productCode);
}

async function getProductVariant(product: ProductWithLatestPrice, variantInfo: VariantInfo) {
  const inputAttributeMap = attributesToMap(variantInfo.attributes);

  const existingVariant = product.variants.find((productVariant) => {
    const variantAttributes = productVariant.attributes as VariantAttribute[];
    return shallowEquals(inputAttributeMap, attributesToMap(variantAttributes));
  });

  if (!existingVariant) {
    console.warn(`Creating new variant: ${JSON.stringify(variantInfo.attributes)}`);
    const productVariant = await createProductVariant({
      productId: product.id,
      variantInfo,
    });
    return productVariant;
  }

  return existingVariant;
}

function attributesToMap(attributes: VariantAttribute[]) {
  return attributes.reduce(
    (acc, attribute) => {
      acc[attribute.name] = attribute.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

function getFlags(variantInfo: VariantInfo, latestPrice: Price | null) {
  if (!latestPrice) {
    return {
      hasPriceDropped: false,
      hasRestocked: false,
      isOutdated: true,
    };
  }

  const diffTime = variantInfo.timestamp.getTime() - latestPrice.timestamp.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  const isStale = diffHours >= 12;

  const hasPriceChanged = variantInfo.priceInCents !== latestPrice.priceInCents;
  const hasPriceDropped = variantInfo.priceInCents < latestPrice.priceInCents;

  const hasStockChanged = variantInfo.inStock !== latestPrice.inStock;
  const hasRestocked = variantInfo.inStock && !latestPrice.inStock;

  const isOutdated = isStale || hasPriceChanged || hasStockChanged;

  return {
    hasPriceDropped,
    hasRestocked,
    isOutdated,
  };
}
