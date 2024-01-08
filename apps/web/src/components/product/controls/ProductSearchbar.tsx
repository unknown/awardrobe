"use client";

import { useParams, useRouter } from "next/navigation";
import { Search } from "@icons/Search";
import { Input } from "@ui/Input";
import { toast } from "sonner";

import { api } from "@/trpc/react";

function isUrl(query: string) {
  try {
    new URL(query);
    return true;
  } catch (e) {
    return false;
  }
}

export function ProductSearchbar() {
  const router = useRouter();
  const params = useParams<{ query?: string }>();

  const getOrAddProduct = api.products.getOrAdd.useMutation({
    onSuccess: (response) => {
      router.push(`/product/${response.publicId}`);
    },
    onError: (error) => {
      toast("Could not find or add product", {
        description: error.message,
      });
    },
  });

  const doSearch = async (query: string) => {
    if (query.length === 0) {
      return;
    }
    if (isUrl(query)) {
      const product = await getOrAddProduct.mutateAsync({
        productUrl: query,
      });
      router.push(`/product/${product.publicId}`);
    } else {
      router.push(`/search/${encodeURIComponent(query)}`);
    }
  };

  const paramsQuery = params.query ? decodeURIComponent(params.query) : "";

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        className={"pl-8"}
        placeholder="Search (product name or URL)"
        defaultValue={paramsQuery}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            doSearch(event.currentTarget.value);
          }
        }}
        disabled={getOrAddProduct.isPending}
      />
    </div>
  );
}
