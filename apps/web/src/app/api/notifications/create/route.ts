import { NextResponse } from "next/server";

import { createNotification, ProductNotification } from "@awardrobe/db";

import { auth } from "@/utils/auth";

export type AddNotificationRequest = {
  variantId: number;
  priceInCents: number;
  priceDrop: boolean;
  restock: boolean;
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
  const session = await auth();

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
      priceInCents: priceInCents,
    });

    return NextResponse.json<AddNotificationSuccess>({
      status: "success",
      notification,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json<AddNotificationError>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
