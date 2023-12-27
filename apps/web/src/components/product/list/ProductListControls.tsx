"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@ui/Input";
import debounce from "lodash.debounce";

export type ProductSearchbarProps = {
  searchQuery: string;
  useDebounce?: boolean;
};

export function ProductSearchbar({ searchQuery, useDebounce = false }: ProductSearchbarProps) {
  const router = useRouter();

  const debouncedSearch = useRef(
    debounce(async (query) => {
      router.push(`/search?q=${query}`);
    }, 1000),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <Input
      type="search"
      className="flex-1"
      placeholder="Search"
      defaultValue={searchQuery}
      onChange={(event) => useDebounce && debouncedSearch(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          debouncedSearch.cancel();
          router.push(`/search?q=${event.currentTarget.value}`);
        }
      }}
    />
  );
}
