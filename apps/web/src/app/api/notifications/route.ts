import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma, ProductNotification } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";

type GetNotificationsRequest = {
  productId: string;
};

type GetNotificationsSuccess = {
  status: "success";
  notifications: ProductNotification[];
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
