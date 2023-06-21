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
import { useState } from "react";

export type NotificationOptions = {
  style: string;
  size: string;
  priceInCents?: number;
  mustBeInStock: boolean;
};

export type AddNotificationDialogProps = {
  defaultOptions: NotificationOptions;
  addNotification: (
    style: string,
    size: string,
    mustBeInStock: boolean,
    priceInCents?: number
  ) => Promise<void>;
  styles: string[];
  sizes: string[];
};

export default function AddNotificationDialog({
  defaultOptions,
  addNotification,
  styles,
  sizes,
}: AddNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions>(defaultOptions);

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
            Create an alert for price drops and restocks.
          </Dialog.Description>
          <form
            onSubmit={async (event) => {
              // TODO: add loading state and handle errors
              event.preventDefault();

              console.log(options);

              await addNotification(
                options.style,
                options.size,
                options.mustBeInStock,
                options.priceInCents
              );
              setOpen(false);
            }}
          >
            <label className="text-primary text-xs font-medium">Style</label>
            <Select
              onValueChange={(style) => {
                setOptions((options) => ({ ...options, style }));
              }}
              defaultValue={options.style}
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
              defaultValue={options.size}
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
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="stock"
                defaultChecked={options.mustBeInStock}
                onCheckedChange={(checked) =>
                  setOptions((options) => ({
                    ...options,
                    mustBeInStock: checked === true ? true : false,
                  }))
                }
              />
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="stock"
              >
                Must be in stock
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit">Create notification</Button>
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
