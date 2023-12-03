import { NextResponse } from "next/server";

import { findPrices, Price } from "@awardrobe/prisma-types";

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
    const prices = await findPrices({ variantId, startDate });
    return NextResponse.json<GetPricesResponse>({
      status: "success",
      prices,
    });
  } catch (e) {
    return NextResponse.json<GetPricesResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
