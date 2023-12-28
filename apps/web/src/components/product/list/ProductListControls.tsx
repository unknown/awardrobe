"use client";

import { useRouter } from "next/navigation";
import { Search } from "@icons/Search";
import { Input } from "@ui/Input";
import { toast } from "sonner";

import { FindProductResponse } from "@/app/api/products/find/route";

export type ProductSearchbarProps = {
  searchQuery: string;
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

export function ProductSearchbar({ searchQuery }: ProductSearchbarProps) {
  const router = useRouter();

  const doSearch = async (query: string) => {
    if (isUrl(query)) {
      const response = await findProduct(query);
      if (response.status === "success") {
        router.push(`/product/${response.product.id}`);
      } else if (response.status === "error") {
        toast("Could not find product", {
          description: response.error,
        });
      }
    } else {
      router.push(`/search?q=${query}`);
    }
  };

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        className="pl-8"
        placeholder="Search (product name or URL)"
        defaultValue={searchQuery}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            doSearch(event.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
