import z from "zod";

// contains stock and price data of products
export const l2sSchema = z.object({
  result: z.object({
    l2s: z.array(
      z.object({
        color: z.object({
          code: z.string(),
          displayCode: z.string(),
        }),
        size: z.object({
          code: z.string(),
          displayCode: z.string(),
        }),
        l2Id: z.string(),
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
    colors: z.array(
      z.object({
        code: z.string(),
        displayCode: z.string(),
        name: z.string(),
      }),
    ),
    sizes: z.array(
      z.object({
        code: z.string(),
        displayCode: z.string(),
        name: z.string(),
      }),
    ),
  }),
});
