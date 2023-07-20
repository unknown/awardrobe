import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui/Dialog";
import { Input } from "@ui/Input";

import {
  AddNotificationRequest,
  AddNotificationResponse,
} from "@/app/api/notifications/create/route";

export type NotificationOptions = {
  priceInCents: number | null;
  priceDrop: boolean;
  restock: boolean;
};

export type AddNotificationDialogProps = {
  variantId: string;
  defaultOptions: NotificationOptions;
};

export function AddNotificationDialog({ variantId, defaultOptions }: AddNotificationDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
          <Button variant="outline">
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
              setLoading(true);

              const result = await createNotification(variantId, {
                priceInCents: options.priceInCents,
                priceDrop: options.priceDrop,
                restock: options.restock,
              });
              if (result.status === "success") {
                router.refresh();
                setOpen(false);
              }

              setLoading(false);
            }}
          >
            <label className="text-primary text-sm font-medium" htmlFor="price">
              Price Threshold (In Cents)
            </label>
            <Input
              id="price"
              value={options.priceInCents ?? ""}
              onChange={(event) => {
                const value = Math.max(1, parseInt(event.target.value.slice(-8)));
                setOptions((options) => ({
                  ...options,
                  priceInCents: isNaN(value) ? null : value,
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
              disabled={loading}
            />
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="price-drop"
                checked={options.priceDrop}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, priceDrop: checked === true })
                }
                disabled={loading}
              />
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="price-drop"
              >
                Notify for price drops
              </label>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="restock"
                checked={options.restock}
                onCheckedChange={(checked) => setOptions({ ...options, restock: checked === true })}
                disabled={loading}
              />
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="restock"
              >
                Notify for restocks
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={loading}>
                Create notification
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

async function createNotification(variantId: string, options: NotificationOptions) {
  const body: AddNotificationRequest = {
    variantId,
    priceInCents: options.priceInCents ?? undefined,
    priceDrop: options.priceDrop,
    restock: options.restock,
  };

  const response = await fetch("/api/notifications/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as AddNotificationResponse;
}
