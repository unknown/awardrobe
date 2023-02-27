"use client";
import { getPrices, PricesResponse } from "@/lib/supabaseClient";
import { cn, formatTimeAgo } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
interface PriceListProps {
  productId: number;
}

export function PricesList({ productId }: PriceListProps) {
  const currentTime = new Date();
  const [data, setData] = useState<PricesResponse>();
  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);

  const getPricesData = async () => {
    const style = styleRef.current?.value;
    const size = sizeRef.current?.value;
    const pricesData = await getPrices(productId, style, size);
    setData(pricesData);
  };

  useEffect(() => {
    getPricesData();
  }, [productId]);

  return (
    <>
      <form className="flex gap-2">
        <label>
          Style: <input placeholder="08" ref={styleRef} />
        </label>
        <label>
          Size: <input placeholder="028" ref={sizeRef} />
        </label>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            getPricesData();
          }}
        >
          Apply Filters
        </button>
      </form>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data?.map((price) => {
          const createdDate = new Date(price.created_at);
          const timeAgo = formatTimeAgo(currentTime, createdDate);
          const priceInDollars = (price.price_in_cents / 100).toLocaleString(
            "en-US",
            {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 2,
            }
          );

          return (
            <div
              className={cn(
                price.in_stock
                  ? "border-2 border-green-300"
                  : "border border-gray-200",
                "rounded-lg p-8 shadow-lg"
              )}
              key={price.id}
            >
              <p
                className="text-neutral-600"
                title={createdDate.toLocaleString()}
              >
                {timeAgo}
              </p>
              <p className="text-red my-2 font-mono text-2xl font-medium">
                {priceInDollars}
              </p>
              <p>
                {price.style} - {price.size}
              </p>
              <p>Stock: {price.stock}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
