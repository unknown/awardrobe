"use client";

import Link from "next/link";

export function NavBar() {
  return (
    <div className="flex gap-4">
      <Link href="/">Price Monitor</Link>
    </div>
  );
}
