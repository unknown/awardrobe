"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function BrowseNavBar() {
  const pathname = usePathname();

  return (
    <div className="text-md flex text-center font-medium">
      <Link
        href="/browse"
        className={twMerge(
          "hover:bg-muted flex-1 p-3 transition-colors",
          pathname === "/browse" ? "underline underline-offset-8" : null,
        )}
      >
        All Products
      </Link>
      <Link
        href="/following"
        className={twMerge(
          "hover:bg-muted flex-1 p-3 transition-colors",
          pathname === "/following" ? "underline underline-offset-8" : null,
        )}
      >
        Following
      </Link>
    </div>
  );
}
