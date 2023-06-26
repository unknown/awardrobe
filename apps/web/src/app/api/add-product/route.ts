import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { UniqloUS } from "@awardrobe/adapters";
import { Prisma } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

type AddProductRequest = {
  productUrl: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ status: "error", error: "Unauthenticated" }, { status: 401 });
  }

  const { productUrl }: AddProductRequest = await req.json();

  try {
    if (productUrl.includes("uniqlo.com/us/")) {
      const productCodeRegex = /([a-zA-Z0-9]{7}-[0-9]{3})/g;
      const productCode = productUrl.match(productCodeRegex)![0];
      await addUniqloUS(productCode);
    } else {
      return NextResponse.json(
        {
          status: "error",
          error: "Unsupported store",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          {
            status: "error",
            error: "Product already exists",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json({ status: "error", error: "Internal server error" }, { status: 500 });
  }
}

async function addUniqloUS(productCode: string) {
  const { name, details } = await UniqloUS.getProductDetails(productCode);

  const store = await prisma.store.findUniqueOrThrow({
    where: {
      handle: "uniqlo-us",
    },
  });

  await prisma.product.create({
    data: {
      productCode,
      name,
      storeId: store.id,
      variants: {
        createMany: {
          data: details.map(({ color, size }) => ({
            style: color,
            size,
          })),
        },
      },
    },
  });
}
