import { Skeleton } from "@ui/Skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-[48px]" />
      ))}
    </div>
  );
}
