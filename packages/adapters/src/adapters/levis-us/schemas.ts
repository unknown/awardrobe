import { z } from "zod";

const galleryImageSchema = z.object({
  format: z.string(),
  galleryIndex: z.number(),
  imageType: z.string(),
  url: z.string(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

const baseProductSchema = z.object({
  baseProduct: z.string(),
  name: z.string(),
  description: z.string(),
  colorGroup: z.string(),
  colorName: z.string(),
  url: z.string(),
  galleryImageList: z.object({
    galleryImage: z.array(galleryImageSchema),
  }),
  variantOptions: z.array(
    z.object({
      comingSoon: z.boolean(),
      displaySizeDescription: z.string(),
      url: z.string(),
      priceData: z.object({
        formattedValue: z.string(),
      }),
      stock: z.object({
        stockLevel: z.number(),
      }),
    }),
  ),
});

const pantsProductSchema = baseProductSchema.merge(
  z.object({
    variantWaist: z.array(z.string()),
    variantLength: z.array(z.string()),
  }),
);

const generalProductSchema = baseProductSchema.merge(
  z.object({
    variantSize: z.array(z.string()),
  }),
);

export const productSchema = z.union([pantsProductSchema, generalProductSchema]);

export const swatchesSchema = z.object({
  swatches: z.array(
    z.object({
      code: z.string(),
      colorName: z.string(),
    }),
  ),
});
