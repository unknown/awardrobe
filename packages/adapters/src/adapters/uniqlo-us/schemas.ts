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
export type Option = z.infer<typeof optionSchema>;

const errorSchema = z.object({
  status: z.literal("nok"),
  error: z.object({
    code: z.number(),
  }),
});

// contains stock and price data of products
const okL2sSchema = z.object({
  status: z.literal("ok"),
  result: z.object({
    l2s: z.array(
      z.object({
        l2Id: z.string(),
        color: partialOptionSchema,
        size: partialOptionSchema,
        pld: partialOptionSchema,
        flags: z.object({
          productFlags: z.array(
            z.object({
              code: z.string(),
            }),
          ),
        }),
      }),
    ),
    stocks: z.record(z.string(), z.object({ quantity: z.number() })),
    prices: z.record(z.string(), z.object({ base: z.object({ value: z.number() }) })),
  }),
});
export const l2sSchema = z.union([okL2sSchema, errorSchema]);

const imageSchema = z.object({
  image: z.string(),
});

const videoSchema = z.object({
  video: z.string(),
});

// contains human-readable names for colors and sizes
const okDetailsSchema = z.object({
  status: z.literal("ok"),
  result: z.object({
    name: z.string(),
    longDescription: z.string(),
    images: z.object({
      sub: z.array(z.union([imageSchema, videoSchema])),
    }),
    colors: z.array(optionSchema),
    sizes: z.array(optionSchema),
    plds: z.array(optionSchema),
  }),
});
export const detailsSchema = z.union([okDetailsSchema, errorSchema]);

// contains general product details
const okProductsSchema = z.object({
  status: z.literal("ok"),
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
export const productsSchema = z.union([okProductsSchema, errorSchema]);
