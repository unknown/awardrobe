import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";
import { Prisma } from "prisma-types";

type DeleteNotificationRequest = {
  notificationId: string;
};

const notFoundResponse = {
  status: "error",
  error: "Notificaton not found",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ status: "error", error: "Unauthenticated" }, { status: 401 });
  }

  const { notificationId }: DeleteNotificationRequest = await req.json();

  try {
    const notification = await prisma.productNotification.findUniqueOrThrow({
      where: {
        id: notificationId,
      },
    });

    if (notification.userId !== session.user.id) {
      return NextResponse.json(notFoundResponse, { status: 400 });
    }

    await prisma.productNotification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json({ status: "success" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2005") {
        return NextResponse.json(notFoundResponse, { status: 400 });
      }
    }
    return NextResponse.json({ status: "error", error: "Internal server error" }, { status: 500 });
  }
}
