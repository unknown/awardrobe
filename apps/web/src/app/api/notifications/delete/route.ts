import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Prisma } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

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
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<DeleteNotificationResponse>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  const { notificationId }: DeleteNotificationRequest = await req.json();

  try {
    const notification = await prisma.productNotification.findUniqueOrThrow({
      where: {
        id: notificationId,
      },
    });

    if (notification.userId !== session.user.id) {
      return NextResponse.json<DeleteNotificationResponse>(
        {
          status: "error",
          error: "Notificaton not found",
        },
        { status: 400 },
      );
    }

    await prisma.productNotification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json<DeleteNotificationResponse>({ status: "success" });
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
