import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AdaptersError, getAdapterFromUrl } from "@awardrobe/adapters";
import {
  createProduct,
  findBrand,
  findOrCreateCollection,
  findOrCreateProductVariantListing,
  findOrCreateStoreListing,
  findProduct,
  findStore,
} from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import { publicProcedure, router } from "../trpc";

export const productsRouter = router({
  getOrAdd: publicProcedure
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

      const store = await findStore({ storeHandle: adapter.storeHandle });
      if (!store) {
        throw new Error("Store not yet supported");
      }

      const externalListingId = await adapter.getListingId(productUrl).catch((error) => {
        if (error instanceof AdaptersError) {
          if (error.name === "PRODUCT_CODE_NOT_FOUND") {
            return null;
          }
        }
        throw error;
      });

      if (!externalListingId) {
        throw new Error("Error retrieving product code");
      }

      const details = await adapter.getListingDetails(externalListingId).catch(async (error) => {
        console.error(error);
        throw new Error("Error retrieving product details");
      });

      const brand = await findBrand({ brandHandle: details.brand });
      if (!brand) {
        throw new Error(`Brand ${details.brand} not found`);
      }

      const collection = await findOrCreateCollection({
        externalCollectionId: details.collectionId,
        brandId: brand.id,
      });

      for (const productDetails of details.products) {
        let product = await findProduct({
          collectionId: collection.id,
          externalProductId: productDetails.productId,
        });

        if (!product) {
          product = await createProduct({
            productDetails,
            collectionId: collection.id,
          });

          const addProductToSearchPromise = addProduct({
            id: product.publicId,
            name: product.name,
            brand: brand.name,
          });

          const addImagePromise = productDetails.imageUrl
            ? addProductImage(product.publicId, productDetails.imageUrl)
            : undefined;

          revalidatePath("/(app)/(browse)/search", "page");

          await Promise.all([addProductToSearchPromise, addImagePromise]);
        }

        const storeListing = await findOrCreateStoreListing({
          externalListingId,
          storeId: store.id,
        });
        const typedProduct = product; // hack to allow typescript to type product as non-null

        await Promise.all(
          productDetails.variants.map((variantDetails) =>
            findOrCreateProductVariantListing({
              variantDetails,
              productId: typedProduct.id,
              storeListingId: storeListing.id,
            }),
          ),
        );
      }

      const firstProductId = details.products[0]?.productId;
      const product = firstProductId
        ? await findProduct({
            collectionId: collection.id,
            externalProductId: firstProductId,
          })
        : null;

      if (!product) {
        throw new Error("Could not find product");
      }

      return product;
    }),
});
