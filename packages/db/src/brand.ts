import { eq } from "drizzle-orm";

import { db } from "./db";
import { brands } from "./schema/brands";
import { Brand } from "./schema/types";

export type FindBrandOptions = {
  brandHandle: string;
};

export async function findBrand(options: FindBrandOptions): Promise<Brand | null> {
  const { brandHandle: brand } = options;

  const brandRecord = await db.query.brands.findFirst({
    where: eq(brands.handle, brand),
  });

  return brandRecord ?? null;
}

export type CreateBrandOptions = {
  name: string;
  handle: string;
  externalUrl: string;
};

export async function createBrand(options: CreateBrandOptions): Promise<Brand> {
  const { name, handle, externalUrl } = options;

  const brandsTable = await db.insert(brands).values({
    name,
    handle,
    externalUrl,
  });

  const created = await db.query.brands.findFirst({
    where: eq(brands.id, Number(brandsTable.insertId)),
  });

  if (!created) {
    throw new Error("Could not create brand");
  }

  return created;
}
