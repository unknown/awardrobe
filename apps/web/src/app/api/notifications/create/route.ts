import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Prisma } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

type AddNotificationRequest = {
  productId: string;
  priceInCents?: number;
  mustBeInStock: boolean;
  style: string;
  size: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ status: "error", error: "Unauthenticated" }, { status: 401 });
  }

  const { productId, priceInCents, mustBeInStock, style, size }: AddNotificationRequest =
    await req.json();

  try {
    const notification = await prisma.productNotification.create({
      data: {
        product: {
          connect: {
            id: productId,
          },
        },
        productVariant: {
          connect: {
            productId_style_size: {
              productId: productId,
              style,
              size,
            },
          },
        },
        mustBeInStock,
        priceInCents,
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ status: "success", notification });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { status: "error", error: "Notificaton for this product already exists" },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ status: "error", error: "Internal server error" }, { status: 500 });
  }
}
