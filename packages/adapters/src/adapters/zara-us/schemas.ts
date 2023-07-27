import { z } from "zod";

export const gridSchema = z.object({
  gridSections: z.array(
    z.object({
      id: z.string(),
      elements: z.array(
        z.object({
          id: z.string(),
          commercialComponents: z.array(
            z.object({
              id: z.number(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  detail: z.object({
    colorSelectorLabel: z.string(),
    colors: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        productId: z.number(),
        sizes: z.array(
          z.object({
            availability: z.union([
              z.literal("in_stock"),
              z.literal("low_on_stock"),
              z.literal("out_of_stock"),
            ]),
            id: z.number(),
            name: z.string(),
            price: z.number(),
          }),
        ),
      }),
    ),
  }),
  seo: z.object({
    keyword: z.string(),
    seoProductId: z.string(),
  }),
});
