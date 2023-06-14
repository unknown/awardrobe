import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

type AddNotificationRequest = {
  productId: string;
  priceInCents?: number;
  mustBeInStock: boolean;
  variants: Record<string, string>;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ status: "error", error: "Unauthenticated" }, { status: 401 });
  }

  const { productId, priceInCents, mustBeInStock, variants }: AddNotificationRequest =
    await req.json();

  if (Object.keys(variants).length === 0) {
    return NextResponse.json({ status: "error", error: "Missing variants" }, { status: 400 });
  }

  await prisma.productNotification.create({
    data: {
      userId: session.user.id,
      priceInCents,
      mustBeInStock,
      variants: {
        connect: Object.entries(variants).map(([optionType, value]) => ({
          productId_optionType_value: {
            productId,
            optionType,
            value,
          },
        })),
      },
    },
  });

  return NextResponse.json({ status: "success" });
}
