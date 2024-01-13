"use client";

import { Fragment, useOptimistic } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { api } from "@/trpc/react";

export type VariantControlsProps = {
  attributes: Record<string, string>;
  attributesOptions: Record<string, string[]>;
};

export function VariantControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    collectionPublicId,
    productPublicId,
    productPublicIds,
    attributesOptions,
    attributes: initialAttributes,
    startTransition,
  } = useProductInfo();
  const [attributes, setAttributes] = useOptimistic(initialAttributes);

  const utils = api.useUtils();

  return (
    <div className="grid grid-cols-[max-content_1fr] flex-wrap items-center gap-3 md:grid-cols-[max-content_1fr_max-content_1fr]">
      {Object.entries(attributesOptions).map(([name, values]) => (
        <Fragment key={name}>
          <label htmlFor={`${name}-input`} className="text-primary text-sm font-medium">
            {name}
          </label>
          <Select
            value={attributes[name] ?? ""}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                productPublicIds.forEach((productPublicId) => {
                  router.prefetch(`/product/${productPublicId}`);
                });
              }
            }}
            onValueChange={(value) => {
              startTransition(async () => {
                setAttributes((attributes) => ({ ...attributes, [name]: value }));

                const variant = await utils.variants.findVariant.fetch({
                  collectionPublicId,
                  attributes: { ...attributes, [name]: value },
                });

                const pathname = `/product/${variant ? variant.product.publicId : productPublicId}`;
                const params = new URLSearchParams({
                  ...attributes,
                  ...Object.fromEntries(searchParams),
                  [name]: value,
                });
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              });
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
    </div>
  );
}
