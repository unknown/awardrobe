import { useState } from "react";
import { Plus } from "@icons/Plus";
import { Button } from "@ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui/Dialog";
import { Input } from "@ui/Input";

import { Product } from "@awardrobe/prisma-types";

import { AddProductResponse } from "@/app/api/products/add/route";

export type AddProductDialogProps = {
  onAddProduct: (newProduct: Product) => void;
};

export function AddProductDialog({ onAddProduct }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productUrl, setProductUrl] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2" />
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add product</DialogTitle>
        <DialogDescription>Start tracking a new product.</DialogDescription>
        <form
          onSubmit={async (event) => {
            // TODO: add loading state and handle errors
            event.preventDefault();
            setIsLoading(true);

            const result = await addProduct(productUrl);
            if (result.status === "success") {
              onAddProduct(result.product);
              setOpen(false);
            }

            setIsLoading(false);
          }}
        >
          <Input
            id="product"
            placeholder="Product url"
            type="url"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            disabled={isLoading}
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              Add product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
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
  return (await response.json()) as AddProductResponse;
}
