import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

type GetProductDataRequest = {
  productId: string;
  startDate: string;
  style: string;
  size: string;
};

export async function POST(req: Request) {
  const { productId, startDate, style, size }: GetProductDataRequest = await req.json();

  const productVariant = await prisma.productVariant.findUniqueOrThrow({
    where: {
      productId_style_size: {
        productId,
        style,
        size,
      },
    },
    include: {
      prices: {
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
        take: 1000,
      },
    },
  });

  return NextResponse.json({
    status: "success",
    prices: productVariant.prices,
  });
}
