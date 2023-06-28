import { Fragment, useState } from "react";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui/Dialog";
import { Input } from "@ui/Input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";
import toast, { Toaster } from "react-hot-toast";

import { ProductNotification } from "@awardrobe/prisma-types";

import { AddNotificationResponse } from "@/app/api/notifications/create/route";

export type NotificationOptions = {
  style: string;
  size: string;
  mustBeInStock: boolean;
  priceInCents?: number;
};

export type AddNotificationDialogProps = {
  productId: string;
  defaultOptions: NotificationOptions;
  onAddNotification: (newNotification: ProductNotification) => void;
  styles: string[];
  sizes: string[];
  disabled?: boolean;
};

export function AddNotificationDialog({
  productId,
  defaultOptions,
  onAddNotification,
  styles,
  sizes,
  disabled,
}: AddNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [options, setOptions] = useState<NotificationOptions>(defaultOptions);

  return (
    <Fragment>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          setOptions(defaultOptions);
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            <Bell className="mr-2" />
            Add notification
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Add Notification</DialogTitle>
          <DialogDescription>
            Create an alert to be notified when the price drops below a threshold or is restocked.
          </DialogDescription>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setIsLoading(true);

              const result = await createNotification(productId, options);
              if (result.status === "success") {
                onAddNotification(result.notification);
                setOpen(false);
              } else if (result.status === "error") {
                toast.error(result.error);
              }

              setIsLoading(false);
            }}
          >
            <label className="text-primary text-sm font-medium">Style</label>
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
            <label className="text-primary text-sm font-medium">Size</label>
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
            <label className="text-primary text-sm font-medium" htmlFor="price">
              Price Threshold (In Cents)
            </label>
            <Input
              id="price"
              value={options.priceInCents !== undefined ? options.priceInCents : ""}
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
                    priceInCents: defaultOptions.priceInCents,
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
        </DialogContent>
      </Dialog>
      <Toaster />
    </Fragment>
  );
}

async function createNotification(productId: string, notificationOptions: NotificationOptions) {
  const { style, size, priceInCents, mustBeInStock } = notificationOptions;
  const response = await fetch("/api/notifications/create", {
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
  return (await response.json()) as AddNotificationResponse;
}
