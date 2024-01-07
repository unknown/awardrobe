"use client";

import { ReactNode } from "react";

import { useHomepage } from "@/components/home/HomepageProvider";

type HomepageTransitionProps = {
  fallback: ReactNode;
  children: ReactNode;
};

export function HomepageTransition({ fallback, children }: HomepageTransitionProps) {
  const { isPending } = useHomepage();

  if (isPending) {
    return fallback;
  }

  return children;
}
