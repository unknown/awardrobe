import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

type PricesRequest = {
  productId: string;
  startDate: string;
  variants: Record<string, string>;
};

export async function POST(req: Request) {
  const { productId, startDate, variants }: PricesRequest = await req.json();

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

  return NextResponse.json({ status: "success", prices });
}
