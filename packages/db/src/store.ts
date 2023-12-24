import { prisma } from "@awardrobe/prisma-types";

export async function findStores() {
  return await prisma.store.findMany();
}
