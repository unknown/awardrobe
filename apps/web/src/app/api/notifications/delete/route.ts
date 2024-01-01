import { NextResponse } from "next/server";

import { deleteNotification } from "@awardrobe/db";

type DeleteNotificationRequest = {
  notificationId: number;
};

type DeleteNotificationSuccess = {
  status: "success";
};

type DeleteNotificationError = {
  status: "error";
  error: string;
};

export type DeleteNotificationResponse = DeleteNotificationSuccess | DeleteNotificationError;

export async function POST(req: Request) {
  try {
    const { notificationId }: DeleteNotificationRequest = await req.json();

    await deleteNotification({ notificationId });

    return NextResponse.json<DeleteNotificationResponse>({
      status: "success",
    });
  } catch (e) {
    return NextResponse.json<DeleteNotificationResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
