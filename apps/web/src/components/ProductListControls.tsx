"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@ui/Input";
import debounce from "lodash.debounce";

import { AddProductDialog } from "@/components/AddProductDialog";

export function ProductListControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        placeholder="Product or store name..."
        defaultValue={searchParams.get("search") ?? undefined}
        onChange={(event) => debouncedSearch(event.target.value)}
      />
      <AddProductDialog
        onAddProduct={({ id }) => {
          router.push(`/product/${id}`);
        }}
      />
    </div>
  );
}
