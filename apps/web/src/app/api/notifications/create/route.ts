import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Prisma, ProductNotification } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

type AddNotificationRequest = {
  variantId: string;
  priceInCents?: number;
  mustBeInStock: boolean;
};

type AddNotificationSuccess = {
  status: "success";
  notification: ProductNotification;
};

type AddNotificationError = {
  status: "error";
  error: string;
};

export type AddNotificationResponse = AddNotificationSuccess | AddNotificationError;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<AddNotificationResponse>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  const { priceInCents, mustBeInStock, variantId }: AddNotificationRequest = await req.json();

  try {
    const notification = await prisma.productNotification.create({
      data: {
        productVariant: {
          connect: {
            id: variantId,
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

    return NextResponse.json<AddNotificationResponse>({ status: "success", notification });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json<AddNotificationResponse>(
          {
            status: "error",
            error: "Notificaton for this product already exists",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json<AddNotificationResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
