import { NextResponse } from "next/server";

import { Price } from "@awardrobe/prisma-types";

import { prisma } from "@/utils/prisma";

type GetPricesRequest = {
  variantId: string;
  startDate: string;
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
  const { variantId, startDate }: GetPricesRequest = await req.json();

  try {
    const productVariant = await prisma.productVariant.findUniqueOrThrow({
      where: {
        id: variantId,
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
