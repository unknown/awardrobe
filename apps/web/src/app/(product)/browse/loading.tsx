import { Skeleton } from "@ui/Skeleton";

export default function Loading() {
  return (
    <section className="container max-w-4xl space-y-2">
      <Skeleton className="h-[38px] max-w-[90px]" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-[24px] w-1/4" />
        <Skeleton className="h-[24px] w-2/3" />
        <Skeleton className="h-[24px] w-1/3" />
        <Skeleton className="h-[24px] w-2/5" />
      </div>
    </section>
  );
}
