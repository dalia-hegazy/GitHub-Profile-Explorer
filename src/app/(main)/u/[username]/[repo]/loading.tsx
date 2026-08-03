import { Skeleton } from "@/components/ui/skeleton";

export default function RepoLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <div className="space-y-3 rounded-lg border p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
