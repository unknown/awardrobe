import { NextResponse } from "next/server";

import { findUserNotifications, NotificationWithVariant } from "@awardrobe/db";

import { auth } from "@/utils/auth";

type GetNotificationsRequest = {
  productId: number;
};

type GetNotificationsSuccess = {
  status: "success";
  notifications: NotificationWithVariant[];
};

type GetNotificationsError = {
  status: "error";
  error: string;
};

export type GetNotificationsResponse = GetNotificationsSuccess | GetNotificationsError;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json<GetNotificationsError>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  try {
    const { productId }: GetNotificationsRequest = await req.json();

    const notifications = await findUserNotifications({ productId, userId: session.user.id });

    return NextResponse.json<GetNotificationsResponse>({
      status: "success",
      notifications,
    });
  } catch (e) {
    return NextResponse.json<GetNotificationsResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
