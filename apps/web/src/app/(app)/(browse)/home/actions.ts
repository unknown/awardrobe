"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/utils/auth";

// TODO: page type
export async function updateHomepage(page: string) {
  if (page === "Following") {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirect("/login");
    }
  }
  cookies().set("page", page);
}
