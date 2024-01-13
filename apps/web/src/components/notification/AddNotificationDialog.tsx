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
import { toast } from "sonner";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { api } from "@/trpc/react";

type AddNotificationOptions = {
  priceInCents: number;
  priceDrop: boolean;
  restock: boolean;
};

export function AddNotificationDialog() {
  const { product, productOptions, attributes: initialAttributes, listings } = useProductInfo();
  const cheapestPriceInCents =
    listings.reduce(
      (cheapestPrice, listing) => {
        const listingPrice = listing.prices.at(-1)?.priceInCents;
        if (!cheapestPrice || (listingPrice && listingPrice < cheapestPrice)) {
          return listingPrice;
        }
        return cheapestPrice;
      },
      listings[0]?.prices.at(-1)?.priceInCents,
    ) ?? 5000;

  const [attributes, setAttributes] = useState<Record<string, string>>(initialAttributes);
  const [options, setOptions] = useState<AddNotificationOptions>({
    priceInCents: cheapestPriceInCents,
    priceDrop: true,
    restock: true,
  });
  const [open, setOpen] = useState(false);

  const utils = api.useUtils();
  const addNotification = api.notifications.create.useMutation({
    onSuccess: async () => {
      await utils.notifications.list.invalidate({ productPublicId: product.publicId });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.data?.code === "UNAUTHORIZED"
          ? "You must be logged in to create a notification"
          : "Failed to create notification",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

            const variant = product.variants.find((variant) => {
              if (variant.attributes.length !== Object.keys(attributes).length) {
                return false;
              }
              return variant.attributes.every(({ name, value }) => attributes[name] === value);
            });

            // TODO: handle this better
            if (!variant) return;

            await addNotification.mutateAsync({
              variantPublicId: variant.publicId,
              priceInCents: options.priceInCents,
              priceDrop: options.priceDrop,
              restock: options.restock,
            });
          }}
        >
          {Object.entries(productOptions).map(([name, values]) => (
            <Fragment key={name}>
              <label htmlFor={`${name}-input`} className="text-primary text-sm font-medium">
                {name}
              </label>
              <Select
                value={attributes[name] ?? ""}
                onValueChange={(value) => {
                  setAttributes((attributes) => ({ ...attributes, [name]: value }));
                }}
              >
                <SelectTrigger className="max-w-[180px]" id={`${name}-input`}>
                  <SelectValue placeholder={`Select a ${name}...`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {values.map((value) => (
                      <SelectItem value={value} key={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Fragment>
          ))}
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
                priceInCents: isNaN(value) ? 0 : value,
              }));
            }}
            onBlur={(event) => {
              if (event.target.value === "") {
                setOptions((options) => ({
                  ...options,
                  priceInCents: cheapestPriceInCents,
                }));
              }
            }}
          />
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="price-drop"
              checked={options.priceDrop}
              onCheckedChange={(checked) => setOptions({ ...options, priceDrop: checked === true })}
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
            />
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="restock"
            >
              Notify for restocks
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={addNotification.isPending}>
              Create notification
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
