import { NextResponse } from "next/server";

import { auth } from "@awardrobe/auth";
import { findUserNotifications, NotificationWithVariant, Public } from "@awardrobe/db";

type GetNotificationsRequest = {
  productPublicId: string;
};

type GetNotificationsSuccess = {
  status: "success";
  notifications: Public<NotificationWithVariant>[];
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
    const { productPublicId }: GetNotificationsRequest = await req.json();

    const notifications = await findUserNotifications({ productPublicId, userId: session.user.id });

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
