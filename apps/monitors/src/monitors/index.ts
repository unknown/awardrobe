import pThrottle from "p-throttle";

import { getAdapter, VariantAttribute, VariantInfo } from "@awardrobe/adapters";
import { createProductVariant, ProductWithLatestPrice } from "@awardrobe/db";
import { Price } from "@awardrobe/prisma-types";
import { proxies } from "@awardrobe/proxies";

import { shallowEquals } from "../utils/utils";
import { updateVariantCallbacks } from "./callbacks";
import { ExtendedVariantInfo, VariantFlags } from "./types";

export async function updateProducts(products: ProductWithLatestPrice[]) {
  const throttle = pThrottle({ limit: proxies.getNumProxies(), interval: 250 });
  const throttledGetUpdatedVariants = throttle(getUpdatedVariants);

  await Promise.allSettled(
    products.map(async (product) => {
      const variants = await throttledGetUpdatedVariants(product).catch((error) => {
        console.error(`Error updating ${product.name}\n${error}`);
        return [] as ExtendedVariantInfo[];
      });

      const variantsCallbacks = variants.map(async (variantInfo) => {
        const options = { product, variantInfo };

        const variantCallbacks = Object.entries(variantInfo.flags).map(([flag, value]) => {
          if (!value) {
            return null;
          }

          return updateVariantCallbacks[flag as keyof VariantFlags](options);
        });

        return Promise.allSettled(variantCallbacks);
      });

      await Promise.allSettled(variantsCallbacks);
    }),
  );
}

async function getUpdatedVariants(product: ProductWithLatestPrice): Promise<ExtendedVariantInfo[]> {
  const adapter = getAdapter(product.store.handle);

  const { variants } = await adapter.getProductDetails(product.productCode);
  if (variants.length === 0) {
    console.warn(`Fetching ${product.productCode} returned empty data`);
  }

  return Promise.all(
    variants.map(async (variantInfo) => {
      const productVariant = await getProductVariant(product, variantInfo);
      const flags = getFlags(variantInfo, productVariant.latestPrice);
      return {
        ...variantInfo,
        productVariant,
        flags,
      };
    }),
  );
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
