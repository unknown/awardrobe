import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getAdapterFromUrl } from "@awardrobe/adapters";
import { Prisma, Product } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

type AddProductRequest = {
  productUrl: string;
};

type AddProductSuccess = {
  status: "success";
  product: Product;
};

type AddProductError = {
  status: "error";
  error: string;
};

export type AddProductResponse = AddProductSuccess | AddProductError;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  const { productUrl }: AddProductRequest = await req.json();

  // TODO: more descriptive errors
  try {
    const adapter = getAdapterFromUrl(productUrl);
    const productCode = await adapter.getProductCode(productUrl, true);
    const { name, prices } = await adapter.getProductDetails(productCode, true);

    const store = await prisma.store.findUniqueOrThrow({
      where: { handle: adapter.storeHandle },
    });

    const product = await prisma.product.create({
      data: {
        productCode,
        name,
        storeId: store.id,
        variants: {
          createMany: {
            data: prices.map(({ attributes, productUrl }) => ({ attributes, productUrl })),
          },
        },
      },
    });

    return NextResponse.json<AddProductResponse>({
      status: "success",
      product,
    });
  } catch (e) {
    console.error(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json<AddProductResponse>(
          {
            status: "error",
            error: "Product already exists",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
