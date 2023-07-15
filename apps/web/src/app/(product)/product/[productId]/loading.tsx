import { Skeleton } from "@ui/Skeleton";

export default function Loading() {
  return (
    <section className="container max-w-4xl space-y-2">
      <div className="mx-auto w-[800px] space-y-6">
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[20px] w-2/3" />
        <Skeleton className="h-[20px] w-full" />
        <Skeleton className="h-[20px] w-full" />
      </div>
    </section>
  );
}
