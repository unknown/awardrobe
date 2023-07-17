"use client";

import { ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@ui/Input";
import debounce from "lodash.debounce";

import { AddProductDialog } from "@/components/AddProductDialog";

export function ProductListControls() {
  const router = useRouter();
  const handleChange = useCallback(
    debounce((e: ChangeEvent<HTMLInputElement>) => {
      router.push(`/browse?search=${e.target.value}`);
    }, 1000),
    [],
  );

  return (
    <div className="flex gap-2">
      <Input
        type="search"
        className="flex-1"
        placeholder="Product or store name..."
        onChange={handleChange}
      />
      <AddProductDialog
        onAddProduct={({ id }) => {
          router.push(`/product/${id}`);
        }}
      />
    </div>
  );
}
