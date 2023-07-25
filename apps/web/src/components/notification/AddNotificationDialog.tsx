import { Fragment, useState } from "react";
import { Bell } from "@icons/Bell";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui/Dialog";
import { Input } from "@ui/Input";

import { VariantAttribute } from "@awardrobe/adapters";
import { ProductVariant } from "@awardrobe/prisma-types";

import { VariantControls } from "@/components/product/ProductControls";
import { CreateNotificationOptions } from "@/hooks/useNotifications";

export type AddNotificationDialogProps = {
  variants: ProductVariant[];
  productOptions: Record<string, string[]>;
  onNotificationCreate: (options: CreateNotificationOptions) => Promise<boolean>;
};

type AddNotificationOptions = {
  priceInCents: number | null;
  priceDrop: boolean;
  restock: boolean;
};

const defaultOptions: AddNotificationOptions = {
  priceInCents: 5000,
  priceDrop: true,
  restock: true,
};

export function AddNotificationDialog({
  variants,
  productOptions,
  onNotificationCreate,
}: AddNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState<AddNotificationOptions>(defaultOptions);
  const [attributes, setAttributes] = useState<Record<string, string>>({});

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

              const variant = variants.find((variant) => {
                const variantAttributes = variant.attributes as VariantAttribute[];
                if (variantAttributes.length !== Object.keys(attributes).length) return false;
                return variantAttributes.every(
                  (attribute) => attributes[attribute.name] === attribute.value,
                );
              });

              // TODO: handle this better
              if (!variant) return;

              setLoading(true);
              const success = await onNotificationCreate({
                variantId: variant.id,
                priceInCents: options.priceInCents,
                priceDrop: options.priceDrop,
                restock: options.restock,
              });
              setLoading(false);

              if (success) {
                setOpen(false);
              }
            }}
          >
            <VariantControls
              productOptions={productOptions}
              attributes={attributes}
              onAttributeChange={(name, value) => {
                setAttributes((attributes) => ({ ...attributes, [name]: value }));
              }}
            />
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
            />
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="price-drop"
                checked={options.priceDrop}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, priceDrop: checked === true })
                }
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
