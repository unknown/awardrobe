import { downloadImage, getAdapter } from "@awardrobe/adapters";
import { addProductImage } from "@awardrobe/media-store";
import { prisma } from "@awardrobe/prisma-types";

async function main() {
  const products = await prisma.product.findMany({ include: { store: true } });
  console.log(`Fixing ${products.length} products`);

  for (const product of products) {
    const adapter = getAdapter(product.store.handle);

    if (!adapter) {
      console.log(`No adapter found for ${product.store.handle}`);
      continue;
    }

    const details = await adapter.getProductDetails(product.productCode).catch(() => {
      console.log(`Failed to fetch details for ${product.store.handle} ${product.productCode}`);
      return null;
    });

    if (!details) {
      continue;
    }

    if (!details.imageUrl) {
      console.log(`No image found for ${product.store.handle} ${product.productCode}`);
      continue;
    }

    await downloadImage(details.imageUrl)
      .then(async (imageBuffer) => addProductImage(product.id, imageBuffer))
      .then(() => console.log(`Added image for ${product.store.handle} ${product.productCode}`))
      .catch(() => console.error("Failed to add image"));
  }
}

void main();
