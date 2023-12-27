"use client";

import { twMerge } from "tailwind-merge";

import { updateHomepage } from "@/app/(app)/home/actions";

export type PageControlsProps = {
  currPage: string;
  pages: string[];
};

export function PageControls({ currPage, pages }: PageControlsProps) {
  return (
    <div className="text-md flex text-center font-medium">
      {pages.map((page) => (
        <button
          key={page}
          className={twMerge(
            "hover:bg-muted flex-1 p-3 transition-colors",
            currPage === page ? "underline underline-offset-8" : null,
          )}
          onClick={async () => {
            await updateHomepage(page);
          }}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
