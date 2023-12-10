import z from "zod";

export const itemSchema = z.object({
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
  inventory: z.object({ inventory: z.number(), published: z.boolean() }),
});
export type Item = z.infer<typeof itemSchema>;

const productSchema = z.object({
  productId: z.string(),
  collection: z.string(),
  productSeoToken: z.string(),
  name: z.string(),
  longDesc: z.string(),
  lowContractPrice: z.number().optional(),
  highContractPrice: z.number().optional(),
  imageSet: z.object({
    prod: z.array(z.object({ id: z.string() })),
  }),
  items: z.array(itemSchema),
});
export type Product = z.infer<typeof productSchema>;

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
