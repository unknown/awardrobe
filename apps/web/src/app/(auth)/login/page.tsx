import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@ui/Button";
import { getServerSession } from "next-auth/next";

import { LoginForm } from "@/components/LoginForm";
import { authOptions } from "@/utils/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.id) {
    redirect("/browse");
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
        <Button variant="secondary">Back</Button>
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
