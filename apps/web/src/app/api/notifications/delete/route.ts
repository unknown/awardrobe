import { NextResponse } from "next/server";

import { deleteNotification } from "@awardrobe/db";
import { Prisma } from "@awardrobe/prisma-types";

type DeleteNotificationRequest = {
  notificationId: string;
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
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2005") {
        return NextResponse.json<DeleteNotificationResponse>(
          {
            status: "error",
            error: "Notificaton not found",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json<DeleteNotificationResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
