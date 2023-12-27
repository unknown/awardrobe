"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/utils/auth";
import { Page } from "./types";

export async function updateHomepage(page: Page) {
  if (page === "Following") {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirect("/login");
    }
  }
  cookies().set("page", page);
}
