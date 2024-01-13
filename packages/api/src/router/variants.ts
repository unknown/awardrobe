import { z } from "zod";

import { VariantAttribute } from "@awardrobe/adapters";
import { findProductVariantFromCollection, findProductVariantListings } from "@awardrobe/db";

import { publicProcedure, router } from "../trpc";

export const variantsRouter = router({
  findVariant: publicProcedure
    .input(
      z.object({
        collectionPublicId: z.string(),
        attributes: z.record(z.string()),
      }),
    )
    .query(async ({ input }) => {
      const { collectionPublicId, attributes } = input;
      const variantAttributes: VariantAttribute[] = Object.entries(attributes).map(
        ([name, value]) => ({ name, value }),
      );

      const variant = await findProductVariantFromCollection({
        collectionPublicId,
        attributes: variantAttributes,
      });

      return variant ?? null;
    }),
  findVariantListings: publicProcedure
    .input(
      z.object({
        collectionPublicId: z.string(),
        attributes: z.record(z.string()),
        startDateOffset: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { collectionPublicId, attributes, startDateOffset } = input;

      const variantAttributes: VariantAttribute[] = Object.entries(attributes).map(
        ([name, value]) => ({ name, value }),
      );

      const variant = await findProductVariantFromCollection({
        collectionPublicId,
        attributes: variantAttributes,
      });

      if (!variant) {
        return [];
      }

      const pricesStartDate = new Date(Math.max(0, Date.now() - startDateOffset));

      const listings = await findProductVariantListings({
        pricesStartDate,
        productVariantId: variant.id,
      });

      return listings;
    }),
});
