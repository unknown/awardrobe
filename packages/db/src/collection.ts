import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { collections } from "./schema/collections";
import { Collection } from "./schema/types";
import { generatePublicId } from "./utils/public-id";

export type FindOrCreateCollectionOptions = {
  brandId: number;
  externalCollectionId: string;
};

export async function findOrCreateCollection(
  options: FindOrCreateCollectionOptions,
): Promise<Collection> {
  const { brandId, externalCollectionId } = options;

  const existingCollection = await db.query.collections.findFirst({
    where: and(
      eq(collections.externalCollectionId, externalCollectionId),
      eq(collections.brandId, brandId),
    ),
  });

  if (existingCollection) {
    return existingCollection;
  }

  const collectionsTable = await db.insert(collections).values({
    externalCollectionId,
    brandId,
    publicId: generatePublicId(),
  });

  const created = await db.query.collections.findFirst({
    where: eq(collections.id, Number(collectionsTable.insertId)),
  });

  if (!created) {
    throw new Error(`Failed to create collection for ${externalCollectionId}`);
  }

  return created;
}
