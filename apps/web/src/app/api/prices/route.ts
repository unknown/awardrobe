import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // TODO: type these better
  const {
    productId,
    startDate,
    variants,
  }: { productId: string; startDate: string; variants: Record<string, string> } = await req.json();

  const prices = await prisma.price.findMany({
    where: {
      productId,
      AND: Object.entries(variants).map(([optionType, value]) => ({
        variants: {
          some: {
            productId,
            optionType,
            value,
          },
        },
      })),
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 1000,
    include: {
      variants: true,
    },
  });

  return NextResponse.json({ prices });
}
