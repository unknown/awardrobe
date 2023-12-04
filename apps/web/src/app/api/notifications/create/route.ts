import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { createNotification, NotificationWithVariant } from "@awardrobe/db";
import { Prisma } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";

export type AddNotificationRequest = {
  variantId: string;
  priceInCents?: number;
  priceDrop: boolean;
  restock: boolean;
};

type AddNotificationSuccess = {
  status: "success";
  notification: NotificationWithVariant;
};

type AddNotificationError = {
  status: "error";
  error: string;
};

export type AddNotificationResponse = AddNotificationSuccess | AddNotificationError;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<AddNotificationError>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  const { variantId, priceInCents, priceDrop, restock }: AddNotificationRequest = await req.json();

  // TODO: better validation
  if (!priceDrop && !restock) {
    return NextResponse.json<AddNotificationError>(
      { status: "error", error: "Invalid notification type" },
      { status: 400 },
    );
  }

  try {
    const notification = await createNotification({
      variantId,
      priceDrop,
      restock,
      userId: session.user.id,
      priceInCents: priceInCents ?? null,
    });

    return NextResponse.json<AddNotificationSuccess>({
      status: "success",
      notification,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json<AddNotificationError>(
          {
            status: "error",
            error: "Notificaton for this product already exists",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json<AddNotificationError>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
