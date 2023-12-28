"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "@icons/Search";
import { Input } from "@ui/Input";
import { toast } from "sonner";

import { AddProductResponse } from "@/app/api/products/add/route";
import { FindProductResponse } from "@/app/api/products/find/route";

function isUrl(query: string) {
  try {
    new URL(query);
    return true;
  } catch (e) {
    return false;
  }
}

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
  return response;
}

async function addProduct(productUrl: string) {
  const response = await fetch("/api/products/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productUrl,
    }),
  });
  return response;
}

export type ProductSearchbarProps = {
  searchQuery: string;
};

export function ProductSearchbar({ searchQuery }: ProductSearchbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const addProductAction = async (productUrl: string) => {
    setLoading(true);
    const response = (await addProduct(productUrl).then((response) =>
      response.json(),
    )) as AddProductResponse;
    setLoading(false);

    if (response.status === "error") {
      toast("Could not add product", {
        description: response.error,
      });
      return;
    }

    router.push(`/product/${response.product.id}`);
  };

  const doSearch = async (query: string) => {
    if (isUrl(query)) {
      setLoading(true);
      const response = await findProduct(query);
      const responseBody = (await response.json()) as FindProductResponse;
      setLoading(false);

      if (responseBody.status === "error") {
        toast("Could not find product", {
          description: responseBody.error,
          action:
            response.status === 404
              ? { label: "Add product", onClick: () => addProductAction(query) }
              : undefined,
        });
        return;
      }

      router.push(`/product/${responseBody.product.id}`);
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
        disabled={loading}
      />
    </div>
  );
}
