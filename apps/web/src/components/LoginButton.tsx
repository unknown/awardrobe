"use client";

import { Button, ButtonProps } from "@ui/Button";
import { signIn } from "next-auth/react";

export type LoginButtonProps = ButtonProps & {};

export function LoginButton(props: LoginButtonProps) {
  return (
    <Button onClick={() => signIn("google")} {...props}>
      Continue with Google
    </Button>
  );
}
