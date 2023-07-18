import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Prisma, prisma } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";

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

  try {
    const { notificationId }: DeleteNotificationRequest = await req.json();

    await prisma.productNotification.delete({
      where: { id: notificationId, userId: session.user.id },
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
