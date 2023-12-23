import { getAdapter, VariantAttribute, VariantInfo } from "@awardrobe/adapters";
import { createProductVariant, ProductWithLatestPrice } from "@awardrobe/db";
import { Price } from "@awardrobe/prisma-types";

import { shallowEquals } from "../utils/utils";
import { updateVariantCallbacks } from "./callbacks";
import { VariantFlags } from "./types";

export async function updateProduct(product: ProductWithLatestPrice) {
  const variants = await getUpdatedVariants(product);

  if (!variants) {
    return;
  }

  const allVariantsCallbacks = variants.map(async (variantInfo) => {
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

async function getUpdatedVariants(product: ProductWithLatestPrice): Promise<VariantInfo[] | null> {
  const adapter = getAdapter(product.store.handle);

  if (!adapter) {
    console.error(`No adapter found for ${product.store.handle}`);
    return null;
  }

  const details = await adapter.getProductDetails(product.productCode).catch((error) => {
    console.error(`Failed to get product details for ${product.name}\n${error}`);
    return null;
  });

  if (!details) {
    return null;
  }

  if (details.variants.length === 0) {
    console.warn(`Product details for ${product.name} is empty`);
  }

  return details.variants;
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
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const isStale = diffDays >= 1;

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
