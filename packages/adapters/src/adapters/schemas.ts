import z from "zod";

const partialOptionSchema = z.object({
  code: z.string(),
  displayCode: z.string(),
});

const optionSchema = z.object({
  code: z.string(),
  displayCode: z.string(),
  name: z.string(),
  display: z.object({
    showFlag: z.boolean(),
  }),
});

export type DetailedOption = z.infer<typeof optionSchema>;

// contains stock and price data of products
export const l2sSchema = z.object({
  result: z.object({
    l2s: z.array(
      z.object({
        l2Id: z.string(),
        color: partialOptionSchema,
        size: partialOptionSchema,
        pld: partialOptionSchema,
      }),
    ),
    stocks: z.record(z.string(), z.object({ quantity: z.number() })),
    prices: z.record(z.string(), z.object({ base: z.object({ value: z.number() }) })),
  }),
});

// contains human-readable names for colors and sizes
export const detailsSchema = z.object({
  result: z.object({
    name: z.string(),
    colors: z.array(optionSchema),
    sizes: z.array(optionSchema),
    plds: z.array(optionSchema),
  }),
});

// contains general product details
export const productsSchema = z.object({
  result: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        productId: z.string(),
        colors: z.array(optionSchema),
        sizes: z.array(optionSchema),
        plds: z.array(optionSchema),
      }),
    ),
    pagination: z.object({
      total: z.number(),
      offset: z.number(),
      count: z.number(),
    }),
  }),
});
