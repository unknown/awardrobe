import { NextResponse } from "next/server";

import { deleteNotification } from "@awardrobe/db";

type DeleteNotificationRequest = {
  notificationPublicId: string;
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
    const { notificationPublicId }: DeleteNotificationRequest = await req.json();

    await deleteNotification({ notificationPublicId });

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
