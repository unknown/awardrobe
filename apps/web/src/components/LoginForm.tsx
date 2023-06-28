"use client";

import { HTMLAttributes, useRef, useState } from "react";
import { Button } from "@ui/Button";
import { Input } from "@ui/Input";
import { signIn } from "next-auth/react";

export type LoginFormProps = HTMLAttributes<HTMLDivElement>;

export const LoginForm = ({ className, ...props }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formMessage, setFormMessage] = useState<string>("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  // TODO: use zod to validate email?
  return (
    <div className={className} {...props}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          setIsLoading(true);

          const signInResult = await signIn("email", {
            email: emailInputRef.current?.value.toLowerCase() ?? "",
            redirect: false,
            callbackUrl: "/browse",
          });

          if (!signInResult?.ok) {
            setFormMessage("Something went wrong! Please try again later.");
          }

          setIsLoading(false);
          setFormMessage("A sign in link has been sent to your email address.");
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
          {formMessage && <p className="text-sm">{formMessage}</p>}
        </div>
      </form>
    </div>
  );
};
