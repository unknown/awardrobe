"use client";

import { HTMLAttributes, useRef, useState } from "react";
import { Button } from "@ui/Button";
import { Input } from "@ui/Input";

export type AddProductFormProps = HTMLAttributes<HTMLDivElement>;

export const AddProductForm = ({ className, ...props }: AddProductFormProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const productInputRef = useRef<HTMLInputElement>(null);

  // TODO: use zod to validate product url
  return (
    <div className={className} {...props}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          await addProduct(productInputRef.current?.value ?? "");
          setIsLoading(false);
        }}
      >
        <div className="flex flex-row gap-2">
          <Input
            id="product"
            placeholder="Product url"
            type="url"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            disabled={isLoading}
            ref={productInputRef}
          />
          <Button disabled={isLoading}>Add</Button>
        </div>
      </form>
    </div>
  );
};

async function addProduct(productUrl: string) {
  const response = await fetch("/api/add-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productUrl,
    }),
  });
  return response.json();
}
