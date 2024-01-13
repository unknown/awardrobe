import { getAdapter } from "@awardrobe/adapters";
import { db, eq } from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";

import { products } from "../../../packages/db/src/schema/products";

async function main() {
  const listings = await db.query.storeListings.findMany({ with: { store: true } });

  console.log(`Fixing ${listings.length} listings`);

  for (const listing of listings) {
    const adapter = getAdapter(listing.store.handle);

    if (!adapter) {
      console.log(`No adapter found for ${listing.store.handle}`);
      continue;
    }

    const details = await adapter.getListingDetails(listing.externalListingId).catch(() => {
      console.log(
        `Failed to fetch details for ${listing.store.name} - ${listing.externalListingId}`,
      );
      return null;
    });

    if (!details) {
      continue;
    }

    for (const product of details.products) {
      if (!product.imageUrl) {
        console.log(`No image found for ${listing.store.handle} ${product.productId}`);
        continue;
      }

      const productRecord = await db.query.products.findFirst({
        where: eq(products.externalProductId, product.productId),
      });

      if (!productRecord) {
        console.error(`No product found for ${listing.store.handle} ${product.productId}`);
        continue;
      }

      await addProductImage(productRecord.publicId, product.imageUrl)
        .then(() => console.log(`Added image for ${listing.store.handle} ${product.productId}`))
        .catch(() => {
          console.log(`Failed to add image for ${listing.store.handle} ${product.productId}`);
        });
    }
  }
}

void main();
