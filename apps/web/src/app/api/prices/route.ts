import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

type PricesRequest = {
  productId: string;
  startDate: string;
  style: string;
  size: string;
};

export async function POST(req: Request) {
  const { productId, startDate, style, size }: PricesRequest = await req.json();

  const prices = await prisma.price.findMany({
    where: {
      productVariant: {
        productId,
        style,
        size,
      },
      timestamp: {
        gte: startDate,
      },
    },
    include: {
      productVariant: true,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 1000,
  });

  return NextResponse.json({ status: "success", prices });
}
