"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "@icons/Search";
import { Input } from "@ui/Input";
import debounce from "lodash.debounce";

import { FindProductResponse } from "@/app/api/products/find/route";

export type ProductSearchbarProps = {
  searchQuery: string;
  useDebounce?: boolean;
};

const isUrl = (query: string) => {
  try {
    new URL(query);
    return true;
  } catch (e) {
    return false;
  }
};

async function findProduct(productUrl: string) {
  const response = await fetch("/api/products/find", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productUrl,
    }),
  });
  return (await response.json()) as FindProductResponse;
}

export function ProductSearchbar({ searchQuery, useDebounce = false }: ProductSearchbarProps) {
  const router = useRouter();

  const doSearch = async (query: string) => {
    if (isUrl(query)) {
      const response = await findProduct(query);
      if (response.status === "success") {
        router.push(`/product/${response.product.id}`);
      } else if (response.status === "error") {
        console.error(response.error);
      }
    } else {
      router.push(`/search?q=${query}`);
    }
  };

  const debouncedSearch = useRef(debounce(doSearch, 2000)).current;

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
        onChange={useDebounce ? (event) => debouncedSearch(event.target.value) : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            debouncedSearch.cancel();
            doSearch(event.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
