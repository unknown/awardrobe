import { cn, formatTimeAgo } from "@/lib/utils";

interface PriceListProps {
  data: any[] | null;
}

export function PricesList({ data }: PriceListProps) {
  const currentTime = new Date();

  return (
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
  );
}
