import { Skeleton } from "@/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-3 rounded-lg border p-5">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-48" />
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
