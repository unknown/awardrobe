"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search } from "@icons/Search";
import { TRPCClientError } from "@trpc/client";
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

  const [loading, setLoading] = useState(false);

  const utils = api.useUtils();
  const addProduct = api.products.add.useMutation({
    onSuccess: (response) => {
      utils.products.invalidate();
      router.push(`/product/${response.publicId}`);
    },
    onError: (error) => {
      toast("Could not add product", {
        description: error.message,
      });
    },
  });

  const doSearch = async (query: string) => {
    if (query.length === 0) {
      return;
    }
    if (isUrl(query)) {
      setLoading(true);
      const product = await utils.products.get.fetch({ productUrl: query }).catch((error) => {
        if (error instanceof TRPCClientError) {
          toast("Could not add product", {
            description: error.message,
            // TODO: better product not found check
            action:
              error.message === "Product not found"
                ? {
                    label: "Add product",
                    onClick: () => {
                      addProduct.mutate({ productUrl: query });
                    },
                  }
                : undefined,
          });
        } else {
          toast("Could not add product", {
            description: "Unknown error",
          });
        }
      });
      setLoading(false);

      if (product) {
        router.push(`/product/${product.publicId}`);
      }
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
        disabled={loading || addProduct.isPending}
      />
    </div>
  );
}
