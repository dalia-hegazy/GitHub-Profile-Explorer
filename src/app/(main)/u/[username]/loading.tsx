import { Skeleton } from "@/components/ui/skeleton";

export default function UserLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Skeleton className="size-24 shrink-0 rounded-full" />
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
