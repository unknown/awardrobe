import { revalidatePath } from "next/cache";
import { z } from "zod";

import { downloadImage, getAdapterFromUrl } from "@awardrobe/adapters";
import { createProduct, createProductVariants, findProductPublic, findStore } from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import { protectedProcedure, publicProcedure, router } from "../trpc";

export const productsRouter = router({
  get: publicProcedure
    .input(
      z.object({
        productUrl: z.string().url(),
      }),
    )
    .query(async ({ input }) => {
      const { productUrl } = input;

      const adapter = getAdapterFromUrl(productUrl);
      if (!adapter) {
        throw new Error("Store not yet supported");
      }

      const store = await findStore({ storeHandle: adapter.storeHandle });
      if (!store) {
        throw new Error("Store not yet supported");
      }

      const productCode = await adapter.getProductCode(productUrl);
      if (!productCode) {
        throw new Error("Error retrieving product code");
      }

      const product = await findProductPublic({ productCode, storeId: store.id });

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    }),
  add: protectedProcedure
    .input(
      z.object({
        productUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      const { productUrl } = input;

      const adapter = getAdapterFromUrl(productUrl);
      if (!adapter) {
        throw new Error("Store not yet supported");
      }

      const [store, productCode] = await Promise.all([
        findStore({ storeHandle: adapter.storeHandle }),
        adapter.getProductCode(productUrl),
      ]);

      if (!store) {
        throw new Error("Store not yet supported");
      }

      if (!productCode) {
        throw new Error("Error retrieving product code");
      }

      const details = await adapter.getProductDetails(productCode).catch((error) => {
        console.error(error);
        return null;
      });
      if (!details) {
        throw new Error("Error retrieving product details");
      }

      const product = await createProduct({
        productCode,
        name: details.name,
        storeId: store.id,
      });

      const createVariantsPromise = createProductVariants({
        productId: product.id,
        variantInfos: details.variants,
      });

      const addProductToSearchPromise = addProduct({
        id: product.publicId,
        name: details.name,
        storeName: store.name,
      });

      const addImagePromise = details.imageUrl
        ? downloadImage(details.imageUrl).then((imageBuffer) =>
            addProductImage(product.publicId, imageBuffer),
          )
        : undefined;

      await Promise.all([createVariantsPromise, addProductToSearchPromise, addImagePromise]);

      revalidatePath("/(app)/(browse)/search", "page");

      const { id: _, ...publicProduct } = product;

      return publicProduct;
    }),
});
