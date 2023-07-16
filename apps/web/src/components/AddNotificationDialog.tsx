import { Fragment, useState } from "react";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui/Dialog";
import { Input } from "@ui/Input";

export type NotificationOptions = {
  mustBeInStock: boolean;
  priceInCents?: number;
};

export type AddNotificationDialogProps = {
  defaultOptions: NotificationOptions;
  onAddNotification: (options: NotificationOptions) => Promise<void>;
};

export function AddNotificationDialog({
  defaultOptions,
  onAddNotification,
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
              setIsLoading(true);
              await onAddNotification(options);
              setIsLoading(false);
              setOpen(false);
            }}
          >
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
    </Fragment>
  );
}
