import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@ui/Button";
import { twMerge } from "tailwind-merge";

import { auth } from "@awardrobe/auth";

import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user.id) {
    redirect("/home");
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={twMerge(
          buttonVariants({ variant: "secondary" }),
          "absolute left-4 top-4 md:left-8 md:top-8",
        )}
      >
        Back
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold">Log In</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to sign in to your account
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
