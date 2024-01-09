import {
  AdaptersError,
  downloadImage,
  getAdapter,
  VariantAttribute,
  VariantInfo,
} from "@awardrobe/adapters";
import {
  createProduct,
  createProductVariant,
  createProductVariants,
  findProductVariants,
  Price,
  ProductVariantWithPrice,
  ProductWithStoreHandle,
  Store,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import { shallowEquals } from "../utils/utils";
import {
  handleDelistedProduct,
  handleOutdatedVariant,
  handlePriceDrop,
  handleRestock,
} from "./callbacks";

// TODO: relocate this?
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL");
}
const revalidateUrl = new URL("/api/products/revalidate", baseUrl);

// TODO: DIRE NEED OF BETTER ERROR HANDLING
export async function insertProduct(productCode: string, store: Store) {
  const adapter = getAdapter(store.handle);
  if (!adapter) {
    throw new Error(`No adapter found for ${store.handle}`);
  }

  const details = await adapter.getProductDetails(productCode);

  const product = await createProduct({
    productCode,
    storeId: store.id,
    name: details.name,
  });

  const createVariantsPromise = createProductVariants({
    productId: product.id,
    variantInfos: details.variants,
  });

  const addProductToSearchPromise = addProduct({
    id: product.publicId,
    name: product.name,
    storeName: store.name,
  });

  const addImagePromise = details.imageUrl
    ? downloadImage(details.imageUrl).then((imageBuffer) =>
        addProductImage(product.publicId, imageBuffer),
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

export async function updateProduct(product: ProductWithStoreHandle) {
  const variants = await findProductVariants({ productId: product.id });

  const adapter = getAdapter(product.store.handle);
  if (!adapter) {
    throw new Error(`No adapter found for ${product.store.handle}`);
  }

  const details = await adapter.getProductDetails(product.productCode).catch(async (error) => {
    if (error instanceof AdaptersError) {
      if (error.name === "PRODUCT_NOT_FOUND") {
        await handleDelistedProduct({ product });
        return null;
      } else if (error.name === "SCHEMA_INVALID_INPUT") {
        // TODO: log this better
        console.error(error);
        return null;
      }
    }
    throw error;
  });

  if (!details) {
    return;
  }

  const allVariantsCallbacks = details.variants.map((variantInfo) => {
    const productVariant = getExistingVariant(variants, variantInfo);

    if (!productVariant) {
      return createProductVariant({ variantInfo, productId: product.id });
    }

    const { isOutdated, hasPriceDropped, hasRestocked } = getFlags(
      variantInfo,
      productVariant.latestPrice,
    );

    return Promise.allSettled([
      isOutdated ? handleOutdatedVariant({ variantInfo, productVariant }) : null,
      hasPriceDropped ? handlePriceDrop({ product, variantInfo, productVariant }) : null,
      hasRestocked ? handleRestock({ product, variantInfo, productVariant }) : null,
    ]);
  });

  await Promise.allSettled(allVariantsCallbacks);
}

function getExistingVariant(variants: ProductVariantWithPrice[], variantInfo: VariantInfo) {
  const inputAttributeMap = attributesToMap(variantInfo.attributes);

  const existingVariant = variants.find((productVariant) =>
    shallowEquals(inputAttributeMap, attributesToMap(productVariant.attributes)),
  );

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
