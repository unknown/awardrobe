"use client";

import { HTMLAttributes, useRef, useState } from "react";
import { Button } from "@ui/Button";
import { Input } from "@ui/Input";
import { signIn } from "next-auth/react";

export type LoginFormProps = HTMLAttributes<HTMLDivElement>;

type LoginStatus = "success" | "error";

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<LoginStatus | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // TODO: use zod to validate email?
  return (
    <div className={className} {...props}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          setIsLoading(true);
          const email = emailInputRef.current?.value.toLowerCase() ?? "";
          const signInResult = await signIn("email", {
            email,
            redirect: false,
            callbackUrl: "/browse",
          });
          setIsLoading(false);

          if (!signInResult?.ok || signInResult?.error) {
            setStatus("error");
          } else {
            setStatus("success");
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            ref={emailInputRef}
          />
          <Button disabled={isLoading}>Continue with Email</Button>
          {!isLoading && status ? <LoginStatusText status={status} /> : null}
        </div>
      </form>
    </div>
  );
}

function LoginStatusText({ status }: { status: LoginStatus }) {
  switch (status) {
    case "success":
      return (
        <p className="text-sm text-blue-500">A sign in link has been sent to your email address.</p>
      );
    case "error":
      return (
        <p className="text-destructive text-sm">Something went wrong! Please try again later.</p>
      );
    default:
      return null;
  }
}
