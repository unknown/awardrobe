import {
  downloadImage,
  getAdapter,
  ProductDetails,
  VariantAttribute,
  VariantInfo,
} from "@awardrobe/adapters";
import {
  createProduct,
  createProductVariant,
  findProductVariants,
  Price,
  ProductVariantWithPrice,
  ProductWithStore,
  Store,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import { shallowEquals } from "../utils/utils";
import { updateVariantCallbacks } from "./callbacks";
import { VariantFlags } from "./types";

// TODO: relocate this?
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL");
}
const revalidateUrl = new URL("/api/products/revalidate", baseUrl);

// TODO: DIRE NEED OF BETTER ERROR HANDLING
export async function insertProduct(productCode: string, store: Store) {
  const details = await getUpdatedDetails({ productCode, storeHandle: store.handle });

  const product = await createProduct({
    productCode,
    storeId: store.id,
    name: details.name,
  });

  const createVariantsPromise = Promise.allSettled(
    details.variants.map(async (variantInfo) =>
      createProductVariant({ variantInfo, productId: product.id }),
    ),
  );

  const addProductToSearchPromise = addProduct({
    id: product.id.toString(),
    name: product.name,
    storeName: store.name,
  });

  const addImagePromise = details.imageUrl
    ? downloadImage(details.imageUrl).then((imageBuffer) =>
        addProductImage(product.id.toString(), imageBuffer),
      )
    : undefined;

  const revalidatePromise = fetch(revalidateUrl.toString());

  const results = await Promise.allSettled([
    createVariantsPromise,
    addProductToSearchPromise,
    addImagePromise,
    revalidatePromise,
  ]);

  if (results.some((result) => result.status === "rejected")) {
    throw new Error("Partial product insert");
  }

  return product;
}

export async function updateProduct(product: ProductWithStore) {
  const variants = await findProductVariants({ productId: product.id });

  const details = await getUpdatedDetails({
    storeHandle: product.store.handle,
    productCode: product.productCode,
  });

  const allVariantsCallbacks = details.variants.map(async (variantInfo) => {
    const productVariant = await getExistingVariant(variants, variantInfo);

    if (!productVariant) {
      return createProductVariant({ variantInfo, productId: product.id });
    }

    const flags = getFlags(variantInfo, productVariant.latestPrice);
    const options = { product, variantInfo, productVariant };

    const singleVariantCallbacks = Object.entries(flags).map(([flag, value]) => {
      if (!value) {
        return null;
      }
      const callback = updateVariantCallbacks[flag as keyof VariantFlags](options);
      return callback;
    });

    await Promise.allSettled(singleVariantCallbacks);
  });

  await Promise.allSettled(allVariantsCallbacks);
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

async function getExistingVariant(variants: ProductVariantWithPrice[], variantInfo: VariantInfo) {
  const inputAttributeMap = attributesToMap(variantInfo.attributes);

  const existingVariant = variants.find((productVariant) => {
    const variantAttributes = productVariant.attributes as VariantAttribute[];
    return shallowEquals(inputAttributeMap, attributesToMap(variantAttributes));
  });

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
