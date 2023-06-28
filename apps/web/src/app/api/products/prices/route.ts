import { NextResponse } from "next/server";

import { Price, Prisma } from "@awardrobe/prisma-types";

import { prisma } from "@/utils/prisma";

type GetPricesRequest = {
  productId: string;
  startDate: string;
  style: string;
  size: string;
};

type GetPricesSuccess = {
  status: "success";
  prices: Price[];
};

type GetPricesError = {
  status: "error";
  error: string;
};

export type GetPricesResponse = GetPricesSuccess | GetPricesError;

export async function POST(req: Request) {
  const { productId, startDate, style, size }: GetPricesRequest = await req.json();

  try {
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
    return NextResponse.json<GetPricesResponse>({
      status: "success",
      prices: productVariant.prices,
    });
  } catch (e) {
    return NextResponse.json<GetPricesResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
