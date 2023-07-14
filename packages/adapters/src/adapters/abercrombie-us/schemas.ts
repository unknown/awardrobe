import z from "zod";

const productSchema = z.object({
  productId: z.string(),
  collection: z.string(),
  productSeoToken: z.string(),
  name: z.string(),
  lowContractPrice: z.number().optional(),
  highContractPrice: z.number().optional(),
  items: z.array(
    z.object({
      itemId: z.string(),
      listPrice: z.number(),
      offerPrice: z.number(),
      definingAttrs: z.record(
        z.string(),
        z.object({
          name: z.string(),
          description: z.string(),
          value: z.string(),
          sequence: z.number(),
          valueSequence: z.number(),
        }),
      ),
      inventory: z.object({ inventory: z.number() }),
    }),
  ),
});

export const listSchema = z.object({
  products: z.array(productSchema),
});

export const collectionSchema = z.object({
  products: z.array(productSchema),
});

export const searchSchema = z.object({
  stats: z.object({
    count: z.number(),
    total: z.number(),
    startNum: z.number(),
  }),
  products: z.array(productSchema),
});
