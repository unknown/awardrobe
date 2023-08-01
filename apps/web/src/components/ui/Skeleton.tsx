import { twMerge } from "tailwind-merge";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge("bg-muted animate-pulse rounded-md", className)} {...props} />;
}
