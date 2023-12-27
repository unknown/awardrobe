"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "@icons/Search";
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
    <div className="relative">
      <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        className="pl-8"
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
    </div>
  );
}
