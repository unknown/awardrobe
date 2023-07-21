import { Fragment, useState } from "react";
import { Plus } from "@icons/Plus";
import { Button } from "@ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui/Dialog";
import { Input } from "@ui/Input";
import toast, { Toaster } from "react-hot-toast";

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
    <Fragment>
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
              event.preventDefault();
              setIsLoading(true);

              const result = await addProduct(productUrl);
              if (result.status === "success") {
                onAddProduct(result.product);
                setOpen(false);
              } else if (result.status === "error") {
                toast.error(result.error);
              }

              setIsLoading(false);
            }}
          >
            <label className="text-primary text-sm font-medium" htmlFor="product">
              Product url
            </label>
            <Input
              id="product"
              placeholder="https://example.com/"
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
      <Toaster />
    </Fragment>
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
