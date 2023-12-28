import { NextResponse } from "next/server";

import { getAdapterFromUrl } from "@awardrobe/adapters";
import { findProductsByProductCodes } from "@awardrobe/db";
import { Product } from "@awardrobe/prisma-types";

export type FindProductRequest = {
  productUrl: string;
};

export type FindProductResponse =
  | {
      status: "success";
      product: Product;
    }
  | {
      status: "error";
      error: string;
    };

export async function POST(req: Request) {
  try {
    const { productUrl }: FindProductRequest = await req.json();

    const adapter = getAdapterFromUrl(productUrl);
    if (!adapter) {
      return NextResponse.json<FindProductResponse>(
        { status: "error", error: "Store not yet supported" },
        { status: 400 },
      );
    }

    const productCode = await adapter.getProductCode(productUrl);
    if (!productCode) {
      return NextResponse.json<FindProductResponse>(
        { status: "error", error: "Error retrieving product code" },
        { status: 400 },
      );
    }

    const products = await findProductsByProductCodes({
      productCodes: [productCode],
      storeHandle: adapter.storeHandle,
    });
    if (!products[0]) {
      return NextResponse.json<FindProductResponse>(
        { status: "error", error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json<FindProductResponse>({ status: "success", product: products[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json<FindProductResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
