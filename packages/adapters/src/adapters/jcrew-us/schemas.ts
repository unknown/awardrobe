import { z } from "zod";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  long_description: z.string(),
  c_familyId: z.string(),
  c_imageURL: z.string(),
  variants: z.array(
    z.object({
      orderable: z.boolean(),
      price: z.number(),
      product_id: z.string(),
      variation_values: z.record(z.string()),
    }),
  ),
  variation_attributes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      values: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        }),
      ),
    }),
  ),
});

const setProductSchema = z.object({
  id: z.string(),
  set_products: z.array(productSchema),
});

export const productsSchema = z.union([productSchema, setProductSchema]);
