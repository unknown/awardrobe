"use client";

import { twMerge } from "tailwind-merge";

import { updateHomepage } from "@/app/(app)/(browse)/home/actions";
import { Page } from "@/app/(app)/(browse)/home/types";

export type PageControlsProps = {
  currPage: Page;
  pages: Page[];
};

export function PageControls({ currPage, pages }: PageControlsProps) {
  return (
    <div className="text-md flex text-center font-medium">
      {pages.map((page) => (
        <button
          key={page}
          className={twMerge(
            "hover:bg-muted flex-1 p-3 transition-colors",
            currPage === page ? "underline underline-offset-8" : "text-muted-foreground",
          )}
          onClick={async () => await updateHomepage(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
