"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@ui/Input";
import debounce from "lodash.debounce";

import { AddProductDialog } from "@/components/product/AddProductDialog";

type ProductListControlsProps = {
  searchQuery: string;
};

export function ProductListControls({ searchQuery }: ProductListControlsProps) {
  const router = useRouter();

  const debouncedSearch = useRef(
    debounce(async (query) => {
      router.push(`/browse?search=${query}`);
    }, 500),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="flex gap-2">
      <Input
        type="search"
        className="flex-1"
        placeholder="Search"
        defaultValue={searchQuery}
        onChange={(event) => debouncedSearch(event.target.value)}
      />
      <AddProductDialog
        onAddProduct={({ id }) => {
          router.refresh();
          router.push(`/product/${id}`);
        }}
      />
    </div>
  );
}
