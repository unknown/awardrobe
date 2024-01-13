"use client";

import { Fragment, useOptimistic } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/Select";

import { useProductInfo } from "@/components/product/ProductInfoProvider";

export function VariantControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { productOptions, attributes: initialAttributes, startTransition } = useProductInfo();
  const [attributes, setAttributes] = useOptimistic(initialAttributes);

  return (
    <div className="grid grid-cols-[max-content_1fr] flex-wrap items-center gap-3 md:grid-cols-[max-content_1fr_max-content_1fr]">
      {Object.entries(productOptions).map(([name, values]) => (
        <Fragment key={name}>
          <label htmlFor={`${name}-input`} className="text-primary text-sm font-medium">
            {name}
          </label>
          <Select
            value={attributes[name] ?? ""}
            onValueChange={(value) => {
              startTransition(() => {
                setAttributes((attributes) => ({ ...attributes, [name]: value }));
                const params = new URLSearchParams({
                  ...attributes,
                  ...Object.fromEntries(searchParams),
                });
                params.set(name, value);
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
