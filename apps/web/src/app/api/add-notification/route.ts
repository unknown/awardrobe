import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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

  await prisma.productNotification.create({
    data: {
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

  return NextResponse.json({ status: "success" });
}
