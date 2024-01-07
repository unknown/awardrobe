"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@awardrobe/auth";

import { Page } from "./types";

export async function updateHomepage(page: Page) {
  if (page === "Following") {
    const session = await auth();
    if (!session) {
      redirect("/login");
    }
  }
  cookies().set("page", page);
}
