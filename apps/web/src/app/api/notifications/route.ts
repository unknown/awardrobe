import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Prisma, prisma } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";

const extendedNotification = Prisma.validator<Prisma.ProductNotificationDefaultArgs>()({
  include: { productVariant: { include: { product: true } } },
});
export type ExtendedNotification = Prisma.ProductNotificationGetPayload<
  typeof extendedNotification
>;

type GetNotificationsRequest = {
  productId: string;
};

type GetNotificationsSuccess = {
  status: "success";
  notifications: ExtendedNotification[];
};

type GetNotificationsError = {
  status: "error";
  error: string;
};

export type GetNotificationsResponse = GetNotificationsSuccess | GetNotificationsError;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<GetNotificationsError>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  try {
    const { productId }: GetNotificationsRequest = await req.json();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      include: {
        productNotifications: {
          where: { productVariant: { productId } },
          include: { productVariant: { include: { product: true } } },
        },
      },
    });
    return NextResponse.json<GetNotificationsResponse>({
      status: "success",
      notifications: user.productNotifications,
    });
  } catch (e) {
    return NextResponse.json<GetNotificationsResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
