"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { updateHomepage } from "@/app/(app)/(browse)/home/actions";
import { Page } from "@/app/(app)/(browse)/home/types";
import { useHomepage } from "@/components/home/HomepageProvider";

export type PageControlsProps = {
  initialPage: Page;
  pages: Page[];
};

export function PageControls({ initialPage, pages }: PageControlsProps) {
  const [currPage, setCurrPage] = useState(initialPage);
  const { startTransition } = useHomepage();

  return (
    <div className="text-md flex text-center font-medium">
      {pages.map((page) => (
        <button
          key={page}
          className={twMerge(
            "hover:bg-muted flex-1 p-3 transition-colors",
            currPage === page ? "underline underline-offset-8" : "text-muted-foreground",
          )}
          onClick={() => {
            setCurrPage(page);
            startTransition(() => {
              updateHomepage(page);
            });
          }}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
