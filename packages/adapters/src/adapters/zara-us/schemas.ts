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
        shopcartMedia: z.array(
          z.object({
            path: z.string(),
            name: z.string(),
            timestamp: z.string(),
          }),
        ),
        sizes: z.array(
          z.object({
            availability: z.union([
              z.literal("in_stock"),
              z.literal("low_on_stock"),
              z.literal("out_of_stock"),
              z.literal("coming_soon"),
            ]),
            id: z.number(),
            name: z.string(),
            price: z.number(),
            sku: z.number(),
          }),
        ),
      }),
    ),
  }),
  seo: z.object({
    keyword: z.string(),
    description: z.string(),
    seoProductId: z.string(),
  }),
});

export type Product = z.infer<typeof productSchema>;
