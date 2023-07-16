import { Skeleton } from "@ui/Skeleton";

export default function Loading() {
  return (
    <section className="container max-w-4xl space-y-2 py-6">
      <Skeleton className="h-[20px] max-w-[80px]" />
      <Skeleton className="h-[40px] w-full" />
      <Skeleton className="h-[40px] w-2/3" />
      <Skeleton className="h-[30px] max-w-[150px]" />
    </section>
  );
}
