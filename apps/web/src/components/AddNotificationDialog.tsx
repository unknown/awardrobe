"use client";

import { cn } from "@/utils/utils";
import { Close } from "@icons/Close";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";
import { useRef, useState } from "react";
import { FilterOptions } from "./ProductControls";
import { Input } from "@ui/Input";

export type NotificationOptions = {
  style: string;
  size: string;
  mustBeInStock: boolean;
  priceInCents?: number;
};

export type AddNotificationDialogProps = {
  productId: string;
  filters: FilterOptions;
  styles: string[];
  sizes: string[];
  priceInCents?: number;
};

export default function AddNotificationDialog({
  productId,
  filters,
  styles,
  sizes,
  priceInCents,
}: AddNotificationDialogProps) {
  const oldFilters = useRef(filters);
  const oldPriceInCents = useRef(priceInCents);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [options, setOptions] = useState<NotificationOptions>({
    style: filters.style,
    size: filters.size,
    mustBeInStock: false,
  });

  if (filters !== oldFilters.current) {
    const { style, size } = filters;
    setOptions((options) => ({ ...options, style, size }));
    oldFilters.current = filters;
  }

  if (priceInCents !== undefined && priceInCents !== oldPriceInCents.current) {
    setOptions((options) => ({ ...options, priceInCents }));
    oldPriceInCents.current = priceInCents;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Add Notification</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-black/50" />
        <Dialog.Content
          className={cn(
            "fixed z-50",
            "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
            "left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]",
            "bg-background"
          )}
        >
          <Dialog.Title className="text-primary text-sm font-medium">Add Notification</Dialog.Title>
          <Dialog.Description className="text-muted-foreground my-2 text-sm">
            Create an alert to be notified when the price drops or is restocked.
          </Dialog.Description>
          <form
            onSubmit={async (event) => {
              // TODO: add loading state and handle errors
              event.preventDefault();
              setIsLoading(true);

              await createNotification(productId, options);

              setIsLoading(false);
              setOpen(false);
            }}
          >
            <label className="text-primary text-xs font-medium">Style</label>
            <Select
              onValueChange={(style) => {
                setOptions((options) => ({ ...options, style }));
              }}
              value={options.style}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a style...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {styles.map((style) => (
                    <SelectItem value={style} key={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <label className="text-primary text-xs font-medium">Size</label>
            <Select
              onValueChange={(size) => {
                setOptions((options) => ({ ...options, size }));
              }}
              value={options.size}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a size...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sizes.map((size) => (
                    <SelectItem value={size} key={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <label className="text-primary text-xs font-medium" htmlFor="price">
              Price Threshold (In Cents)
            </label>
            <Input
              id="price"
              value={options.priceInCents ?? ""}
              onChange={(event) => {
                const value = Math.max(1, parseInt(event.target.value.slice(-8)));
                setOptions((options) => ({
                  ...options,
                  priceInCents: isNaN(value) ? undefined : value,
                }));
              }}
              onBlur={(event) => {
                if (event.target.value === "") {
                  setOptions((options) => ({
                    ...options,
                    priceInCents,
                  }));
                }
              }}
            />
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="stock"
                checked={options.mustBeInStock}
                onCheckedChange={(checked) =>
                  setOptions({
                    ...options,
                    mustBeInStock: checked === true ? true : false,
                  })
                }
                disabled={isLoading}
              />
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="stock"
              >
                Must be in stock
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                Create notification
              </Button>
            </div>
          </form>
          <Dialog.Close asChild>
            <Button
              variant="secondary"
              className="absolute right-3.5 top-3.5 inline-flex items-center justify-center rounded-full p-1"
              aria-label="Close"
            >
              <Close />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

async function createNotification(productId: string, notificationOptions: NotificationOptions) {
  // TODO: make this more type-safe
  const { style, size, priceInCents, mustBeInStock } = notificationOptions;
  const response = await fetch("/api/add-notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      style,
      size,
      priceInCents,
      mustBeInStock,
    }),
  });
  return response.json();
}
